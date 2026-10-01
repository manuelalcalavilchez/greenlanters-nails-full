import 'dotenv/config';
import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT || process.env.API_PORT || 3003);
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// SQLite Database
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const dbPath = path.join(DATA_DIR, 'greenlanters.db');
const TENANT_ID = process.env.TENANT_ID || 'default';
const TENANT_TABLES = new Set(['appointments', 'custom_designs', 'salon_config', 'services', 'specialists', 'booking_requests', 'gallery']);
const AUTH_FILE = path.join(DATA_DIR, 'staff-auth.json');
const TOKEN_SECRET = process.env.STAFF_TOKEN_SECRET || crypto.randomBytes(32).toString('hex');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function verifyPassword(password, record) {
  const candidate = crypto.scryptSync(password, record.salt, 64);
  const stored = Buffer.from(record.hash, 'hex');
  return stored.length === candidate.length && crypto.timingSafeEqual(candidate, stored);
}
function isStaffInitialized() {
  return fs.existsSync(AUTH_FILE);
}
function loadStaffAuth() {
  if (!isStaffInitialized()) return null;
  try { return JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch { return null; }
}
function saveStaffPassword(password) {
  fs.writeFileSync(AUTH_FILE, JSON.stringify({ ...hashPassword(password), updatedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
}
function signStaffToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  return body + '.' + signature;
}
function verifyStaffToken(token) {
  if (!token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    return payload.exp > Date.now() ? payload : null;
  } catch { return null; }
}
function requireStaff(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!verifyStaffToken(token)) return res.status(401).json({ error: 'Sesión de staff no válida o caducada.' });
  next();
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error('Database error:', err);
  else console.log(`INFO: SQLite conectado: ${dbPath}`);
});

// ==================== EMAIL (nodemailer) ====================
const TEMPLATES_DIR = path.join(__dirname, 'templates');

let transporter = null;
if (process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('INFO: SMTP configurado:', process.env.SMTP_HOST || 'smtp.gmail.com');
} else {
  console.warn('AVISO:  SMTP no configurado en .env (SMTP_USER/SMTP_PASS). Los emails solo se mostrarn en consola.');
}

// Sustituye {{variable}} en la plantilla HTML por su valor
const renderTemplate = (templateName, vars = {}) => {
  const templatePath = path.join(TEMPLATES_DIR, templateName);
  let html = fs.readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(vars)) {
    html = html.replaceAll(`{{${key}}}`, value === undefined || value === null ? '' : String(value));
  }
  return html;
};

// Envía un email; nunca lanza (se registra el error y se sigue)
const sendEmail = async ({ to, subject, templateName, vars }) => {
  if (!to) return { success: false, error: 'Sin destinatario' };
  try {
    const html = renderTemplate(templateName, vars);
    if (!transporter) {
      console.log(`INFO: [DEV - sin SMTP] Para: ${to} | Asunto: ${subject}`);
      return { success: true, dev: true };
    }
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Las Greenlanters Nails" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    console.log(`INFO: Email enviado a ${to}: ${subject}`);
    return { success: true };
  } catch (err) {
    console.error(`R Error enviando email a ${to}:`, err.message);
    return { success: false, error: err.message };
  }
};

// Promisify db methods + aislamiento por tenant.
const scopeTenantQuery = (sql, params = []) => {
  const text = String(sql);
  const tableMatch = text.match(/\b(?:FROM|UPDATE|INTO)\s+([a-z_]+)\b/i);
  const table = tableMatch?.[1]?.toLowerCase();
  if (!table || !TENANT_TABLES.has(table) || /\btenant_id\b/i.test(text)) return { sql: text, params };

  if (/^\s*SELECT\b/i.test(text)) {
    if (/\bWHERE\b/i.test(text)) return { sql: text.replace(/\bWHERE\b/i, 'WHERE tenant_id = ? AND '), params: [TENANT_ID, ...params] };
    const marker = text.search(/\b(ORDER BY|GROUP BY|LIMIT|HAVING)\b/i);
    if (marker >= 0) return { sql: text.slice(0, marker) + 'WHERE tenant_id = ? ' + text.slice(marker), params: [TENANT_ID, ...params] };
    return { sql: text + ' WHERE tenant_id = ?', params: [...params, TENANT_ID] };
  }

  if (/^\s*INSERT\b/i.test(text)) {
    const m = text.match(/^(\s*INSERT\s+INTO\s+[a-z_]+\s*)\(([^)]+)\)(\s*VALUES\s*)\(([^)]+)\)/i);
    if (m) return { sql: m[1] + '(tenant_id, ' + m[2] + ')' + m[3] + '(?, ' + m[4] + ')', params: [TENANT_ID, ...params] };
  }

  if (/^\s*UPDATE\b/i.test(text) || /^\s*DELETE\b/i.test(text)) {
    if (/\bWHERE\b/i.test(text)) return { sql: text.replace(/\bWHERE\b/i, 'WHERE tenant_id = ? AND '), params: [TENANT_ID, ...params] };
    return { sql: text + ' WHERE tenant_id = ?', params: [TENANT_ID, ...params] };
  }

  return { sql: text, params };
};

const dbRun = (sql, params = []) => new Promise((resolve, reject) => {
  const scoped = scopeTenantQuery(sql, params);
  db.run(scoped.sql, scoped.params, function(err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const dbGet = (sql, params = []) => new Promise((resolve, reject) => {
  const scoped = scopeTenantQuery(sql, params);
  db.get(scoped.sql, scoped.params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql, params = []) => new Promise((resolve, reject) => {
  const scoped = scopeTenantQuery(sql, params);
  db.all(scoped.sql, scoped.params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows || []);
  });
});

const ensureColumn = async (table, column, definition) => {
  const columns = await dbAll(`PRAGMA table_info(${table})`);
  if (!columns.some(c => c.name === column)) {
    await dbRun(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
};

// Crear tablas al iniciar
const initDatabase = async () => {
  try {
    // Tabla de citas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        locator TEXT UNIQUE,
        serviceIds TEXT,
        addonIds TEXT,
        specialistId TEXT,
        date TEXT,
        time TEXT,
        totalPrice REAL,
        totalDuration INTEGER,
        clientName TEXT,
        clientPhone TEXT,
        clientEmail TEXT,
        status TEXT,
        notes TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    // Tabla de diseños personalizados
    await dbRun(`
      CREATE TABLE IF NOT EXISTS custom_designs (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        clientName TEXT,
        clientPhone TEXT,
        clientEmail TEXT,
        shape TEXT,
        notes TEXT,
        imageBase64 TEXT,
        status TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);

    // Tabla de configuración del salón
    await dbRun(`
      CREATE TABLE IF NOT EXISTS salon_config (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT,
        phone TEXT,
        email TEXT,
        address TEXT,
        hours TEXT,
        logo TEXT,
        coverPhoto TEXT,
        primaryColor TEXT,
        accentColor TEXT,
        backgroundColor TEXT,
        whatsapp TEXT,
        calendarPublic INTEGER DEFAULT 1,
        workingHours TEXT,
        blockedSlots TEXT,
        vacations TEXT,
        nailShapes TEXT,
        nailLengths TEXT,
        nailStyles TEXT,
        products TEXT,
        updatedAt TEXT
      )
    `);

    // Migracin segura para instalaciones existentes
    await ensureColumn('salon_config', 'whatsapp', 'TEXT');
    await ensureColumn('salon_config', 'calendarPublic', 'INTEGER DEFAULT 1');
    await ensureColumn('salon_config', 'workingHours', 'TEXT');
    await ensureColumn('salon_config', 'blockedSlots', 'TEXT');
    await ensureColumn('salon_config', 'vacations', 'TEXT');
    await ensureColumn('salon_config', 'nailShapes', 'TEXT');
    await ensureColumn('salon_config', 'nailLengths', 'TEXT');
    await ensureColumn('salon_config', 'nailStyles', 'TEXT');
    await ensureColumn('salon_config', 'products', 'TEXT');

    // Tabla de servicios
    await dbRun(`
      CREATE TABLE IF NOT EXISTS services (
        id TEXT PRIMARY KEY,
        name TEXT,
        duration INTEGER,
        price REAL,
        description TEXT,
        active INTEGER
      )
    `);

    // Campos editoriales del catlogo pblico (migracin segura)
    await ensureColumn('services', 'category', 'TEXT');
    await ensureColumn('services', 'shortDescription', 'TEXT');
    await ensureColumn('services', 'longDescription', 'TEXT');
    await ensureColumn('services', 'featured', 'INTEGER DEFAULT 0');
    await ensureColumn('services', 'sortOrder', 'INTEGER DEFAULT 0');
    await ensureColumn('services', 'instagramSource', 'TEXT');
    await ensureColumn('services', 'updatedAt', 'TEXT');

    // Tabla de especialistas
    await dbRun(`
      CREATE TABLE IF NOT EXISTS specialists (
        id TEXT PRIMARY KEY,
        name TEXT,
        role TEXT,
        photo TEXT,
        description TEXT,
        active INTEGER
      )
    `);

    // Tabla de solicitudes de cita
    await dbRun(`
      CREATE TABLE IF NOT EXISTS booking_requests (
        id TEXT PRIMARY KEY,
        clientName TEXT,
        clientPhone TEXT,
        clientEmail TEXT,
        serviceType TEXT,
        preferredDate TEXT,
        preferredTime TEXT,
        notes TEXT,
        status TEXT,
        createdAt TEXT,
        respondedAt TEXT
      )
    `);

    // Tabla de galería
    await dbRun(`
      CREATE TABLE IF NOT EXISTS gallery (
        id TEXT PRIMARY KEY,
        photoBase64 TEXT,
        title TEXT,
        caption TEXT,
        uploadedAt TEXT,
        displayOrder INTEGER
      )
    `);

    // Bloques editoriales reutilizables para la web pública.
    await dbRun(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id TEXT PRIMARY KEY,
        tenant_id TEXT DEFAULT 'default',
        key TEXT,
        type TEXT,
        title TEXT,
        subtitle TEXT,
        body TEXT,
        image TEXT,
        buttonText TEXT,
        buttonUrl TEXT,
        sortOrder INTEGER DEFAULT 0,
        enabled INTEGER DEFAULT 1,
        updatedAt TEXT
      )
    `);

    // Tenant por defecto: se añade sin destruir datos existentes.
    for (const table of [...TENANT_TABLES, 'content_blocks']) {
      await ensureColumn(table, 'tenant_id', "TEXT DEFAULT 'default'");
      await dbRun(`UPDATE ${table} SET tenant_id = ? WHERE tenant_id IS NULL OR tenant_id = ''`, [TENANT_ID]);
    }

    // Índices de tenant para consultas y aislamiento operativo.
    for (const table of [...TENANT_TABLES, 'content_blocks']) {
      await dbRun(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant_id ON ${table}(tenant_id)`);
    }

    // Semilla inicial: una sola cabina/especialista y catálogo real del proyecto.
    const serviceCount = await dbGet('SELECT COUNT(*) AS c FROM services');
    if (Number(serviceCount?.c || 0) === 0) {
      const seedServices = [
        ['unas-gel', 'Uñas en gel', 'gel', 'Manicura y diseños realizados con técnica de gel.', 1],
        ['unas-poligel', 'Uñas en poligel', 'poligel', 'Diseños y trabajos realizados con técnica de poligel.', 2],
        ['dibujos-a-mano', 'Dibujos a mano', 'decoracion', 'Diseños personalizados y detalles realizados a mano.', 3],
        ['decoracion-personalizada', 'Decoración personalizada', 'diseno_personalizado', 'Decoración y nail art adaptados al estilo de cada clienta.', 4]
      ];
      for (const [id, name, category, description, sortOrder] of seedServices) {
        await dbRun(
          'INSERT INTO services (id, name, duration, price, description, shortDescription, category, featured, sortOrder, instagramSource, updatedAt, active) VALUES (?, ?, NULL, NULL, ?, ?, ?, 1, ?, ?, ?, 1)',
          [id, name, description, description, category, sortOrder, '@greenlanters.nails', new Date().toISOString()]
        );
      }
    }

    const specialistCount = await dbGet('SELECT COUNT(*) AS c FROM specialists');
    if (Number(specialistCount?.c || 0) === 0) {
      await dbRun(
        'INSERT INTO specialists (id, name, role, photo, description, active) VALUES (?, ?, ?, ?, ?, 1)',
        ['any', 'Cualquiera Disponible', 'Equipo Greenlanters', '', 'Asignación automática a la cabina disponible.']
      );
    }

    const configCount = await dbGet('SELECT COUNT(*) AS c FROM salon_config');
    if (Number(configCount?.c || 0) === 0) {
      const defaultHours = [
        { day: 'Lunes', open: '10:00', close: '20:00', enabled: true },
        { day: 'Martes', open: '10:00', close: '20:00', enabled: true },
        { day: 'Miércoles', open: '10:00', close: '20:00', enabled: true },
        { day: 'Jueves', open: '10:00', close: '20:00', enabled: true },
        { day: 'Viernes', open: '10:00', close: '20:00', enabled: true },
        { day: 'Sábado', open: '10:00', close: '14:00', enabled: true },
        { day: 'Domingo', open: '10:00', close: '14:00', enabled: false }
      ];
      await dbRun(
        `INSERT INTO salon_config
         (id, name, description, phone, email, address, hours, logo, coverPhoto,
          primaryColor, accentColor, backgroundColor, whatsapp, calendarPublic,
          workingHours, blockedSlots, vacations, nailShapes, nailLengths, nailStyles, products, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'main', 'Las Greenlanters Nails',
          'Manicurista · Técnica en uñas gel y poligel · Dibujos a mano, decoración · Almería · Tus manos hablan por ti, haz que destaquen',
          '', '', 'Almería',
          '',
          '/assets/logo-greenlanters.webp', '', '#082D05', '#8CFF00', '#F7F8EF', '',
          0, JSON.stringify([]), JSON.stringify([]), JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify([]), new Date().toISOString()
        ]
      );
    }

    const contentCount = await dbGet('SELECT COUNT(*) AS c FROM content_blocks');
    if (Number(contentCount?.c || 0) === 0) {
      const defaults = [
        ['hero', 'hero', 'Las Greenlanters Nails', 'Tus manos hablan por ti', 'Haz que destaquen.', '', 'Reservar cita', '#reservar', 1],
        ['about', 'section', 'Sobre nosotros', '', 'Manicura, nail art y diseños personalizados.', '', '', '', 2],
        ['booking', 'cta', 'Reserva tu cita', '', 'Elige tu servicio y solicita tu cita desde cualquier dispositivo.', '', 'Reservar ahora', '#reservar', 3],
        ['social', 'social', 'Síguenos en Instagram', '', '@greenlanters.nails', '', 'Ver Instagram', '', 4]
      ];
      for (const [key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder] of defaults) {
        await dbRun(
          'INSERT INTO content_blocks (id, tenant_id, key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder, enabled, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)',
          [`content_${key}`, TENANT_ID, key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder, new Date().toISOString()]
        );
      }
    }

    console.log('Base de datos inicializada correctamente');
  } catch (err) {
    console.error('Error inicializando BD:', err);
  }
};

// ==================== AUTENTICACIÓN STAFF ====================

app.get('/api/staff/status', (_req, res) => {
  res.json({ initialized: isStaffInitialized() });
});

app.post('/api/staff/setup-password', (req, res) => {
  if (isStaffInitialized()) return res.status(409).json({ error: 'La contraseña inicial ya fue configurada.' });
  const password = String(req.body?.password || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  if (password.length < 8) return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres.' });
  if (password !== confirmPassword) return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
  saveStaffPassword(password);
  res.json({ ok: true, token: signStaffToken({ role: 'staff', exp: Date.now() + 8 * 60 * 60 * 1000 }) });
});

app.post('/api/staff/login', (req, res) => {
  const auth = loadStaffAuth();
  if (!auth) return res.status(428).json({ error: 'SETUP_REQUIRED', message: 'Debes crear la contraseña inicial.' });
  if (!verifyPassword(String(req.body?.password || ''), auth)) return res.status(401).json({ error: 'Credenciales incorrectas.' });
  res.json({ ok: true, token: signStaffToken({ role: 'staff', exp: Date.now() + 8 * 60 * 60 * 1000 }) });
});

app.post('/api/staff/change-password', requireStaff, (req, res) => {
  const currentPassword = String(req.body?.currentPassword || '');
  const newPassword = String(req.body?.newPassword || '');
  const confirmPassword = String(req.body?.confirmPassword || '');
  const auth = loadStaffAuth();
  if (!auth || !verifyPassword(currentPassword, auth)) return res.status(400).json({ error: 'La contraseña actual no es correcta.' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
  if (newPassword !== confirmPassword) return res.status(400).json({ error: 'Las nuevas contraseñas no coinciden.' });
  saveStaffPassword(newPassword);
  res.json({ ok: true, message: 'Contraseña actualizada correctamente.' });
});

// Las operaciones administrativas requieren token. Se mantienen públicas:
// reservas de clientes, feed de Instagram y descarga de imágenes de galería.
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/staff/')) return next();
  if (req.path === '/booking-request' && req.method === 'POST') return next();
  if (req.path === '/public/content-feed' && req.method === 'GET') return next();
  if (/^\/gallery\/[^/]+\/image$/.test(req.path) && req.method === 'GET') return next();
  if (req.path === '/health' && req.method === 'GET') return next();

  const protectedRead = req.method === 'GET' &&
    ['/appointments', '/designs', '/booking-requests'].includes(req.path);
  const protectedWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);

  if (protectedRead || protectedWrite) return requireStaff(req, res, next);
  next();
});

// ==================== RUTAS API ====================

// CONTENIDOS EDITORIALES
app.get('/api/content', async (_req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM content_blocks WHERE enabled = 1 ORDER BY sortOrder ASC, key ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/content', async (req, res) => {
  try {
    const { id, key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder, enabled } = req.body;
    const contentId = id || `content_${key || Date.now()}`;
    await dbRun(
      'INSERT INTO content_blocks (id, tenant_id, key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder, enabled, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [contentId, TENANT_ID, key || contentId, type || 'section', title || '', subtitle || '', body || '', image || '', buttonText || '', buttonUrl || '', Number(sortOrder) || 0, enabled === false ? 0 : 1, new Date().toISOString()]
    );
    res.json({ success: true, id: contentId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/content/:id', async (req, res) => {
  try {
    const { key, type, title, subtitle, body, image, buttonText, buttonUrl, sortOrder, enabled } = req.body;
    await dbRun(
      'UPDATE content_blocks SET key = ?, type = ?, title = ?, subtitle = ?, body = ?, image = ?, buttonText = ?, buttonUrl = ?, sortOrder = ?, enabled = ?, updatedAt = ? WHERE id = ?',
      [key, type, title || '', subtitle || '', body || '', image || '', buttonText || '', buttonUrl || '', Number(sortOrder) || 0, enabled === false ? 0 : 1, new Date().toISOString(), req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/content/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM content_blocks WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CITAS
const APPOINTMENT_STATUS_TRANSITIONS = {
  Pendiente: ['Confirmada', 'Cancelada'],
  Confirmada: ['Completada', 'Cancelada'],
  Completada: [],
  Cancelada: []
};

const isAppointmentStatus = (status) => Object.prototype.hasOwnProperty.call(APPOINTMENT_STATUS_TRANSITIONS, status);

const canTransitionAppointmentStatus = (from, to) => from === to || Boolean(APPOINTMENT_STATUS_TRANSITIONS[from]?.includes(to));

app.get('/api/appointments', async (req, res) => {
  try {
    const appointments = await dbAll('SELECT * FROM appointments ORDER BY date DESC, time DESC');
    res.json(appointments.map(a => ({
      ...a,
      serviceIds: JSON.parse(a.serviceIds || '[]'),
      addonIds: JSON.parse(a.addonIds || '[]')
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { id, locator, serviceIds, addonIds, specialistId, date, time, totalPrice, totalDuration, clientName, clientPhone, clientEmail, notes } = req.body;
    
    await dbRun(
      `INSERT INTO appointments 
       (id, locator, serviceIds, addonIds, specialistId, date, time, totalPrice, totalDuration, clientName, clientPhone, clientEmail, status, notes, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, locator, JSON.stringify(serviceIds), JSON.stringify(addonIds), specialistId, date, time, totalPrice, totalDuration, clientName, clientPhone, clientEmail, 'Confirmada', notes || '', new Date().toISOString(), new Date().toISOString()]
    );

    sendEmail({
      to: clientEmail,
      subject: `Tu cita est confirmada - PIN ${locator}  Las Greenlanters Nails`,
      templateName: 'booking-confirmed.html',
      vars: { clientName, locator, date, time, totalPrice: totalPrice ?? 0 }
    });

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/appointments/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    if (!isAppointmentStatus(status)) {
      return res.status(400).json({ error: 'Estado de cita no válido.' });
    }

    const current = await dbGet('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
    if (!current) return res.status(404).json({ error: 'Cita no encontrada.' });
    if (!canTransitionAppointmentStatus(current.status, status)) {
      return res.status(409).json({
        error: `Transición de cita no permitida: ${current.status} → ${status}`
      });
    }

    await dbRun(
      'UPDATE appointments SET status = ?, notes = ?, updatedAt = ? WHERE id = ?',
      [status, notes ?? current.notes ?? '', new Date().toISOString(), req.params.id]
    );

    if (status === 'Cancelada') {
      const appt = await dbGet('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
      if (appt?.clientEmail) {
        sendEmail({
          to: appt.clientEmail,
          subject: `Tu cita ${appt.locator} ha sido cancelada - Las Greenlanters Nails`,
          templateName: 'booking-cancelled.html',
          vars: { clientName: appt.clientName, locator: appt.locator, date: appt.date, time: appt.time }
        });
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM appointments WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DISEOS
app.get('/api/designs', async (req, res) => {
  try {
    const designs = await dbAll('SELECT * FROM custom_designs ORDER BY createdAt DESC');
    res.json(designs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/designs', async (req, res) => {
  try {
    const { id, code, clientName, clientPhone, clientEmail, shape, notes, imageBase64 } = req.body;
    
    await dbRun(
      `INSERT INTO custom_designs 
       (id, code, clientName, clientPhone, clientEmail, shape, notes, imageBase64, status, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, clientName, clientPhone, clientEmail, shape, notes, imageBase64, 'Pendiente', new Date().toISOString(), new Date().toISOString()]
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/designs/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    await dbRun(
      'UPDATE custom_designs SET status = ?, updatedAt = ? WHERE id = ?',
      [status, new Date().toISOString(), req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/designs/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM custom_designs WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CONFIGURACIN
app.get('/api/config', async (req, res) => {
  try {
    const config = await dbGet('SELECT * FROM salon_config WHERE id = ?', ['main']);
    res.json(config || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/config', async (req, res) => {
  try {
    const {
      name, description, phone, email, address, hours, logo, coverPhoto,
      primaryColor, accentColor, backgroundColor, whatsapp, calendarPublic,
      workingHours, blockedSlots, vacations, nailShapes, nailLengths,
      nailStyles, products
    } = req.body;

    const existing = await dbGet('SELECT id FROM salon_config WHERE id = ?', ['main']);
    const values = [
      name, description, phone, email, address, hours, logo, coverPhoto,
      primaryColor, accentColor, backgroundColor, whatsapp,
      calendarPublic === undefined ? 1 : (calendarPublic ? 1 : 0),
      JSON.stringify(workingHours ?? []),
      JSON.stringify(blockedSlots ?? []),
      JSON.stringify(vacations ?? []),
      JSON.stringify(nailShapes ?? []),
      JSON.stringify(nailLengths ?? []),
      JSON.stringify(nailStyles ?? []),
      JSON.stringify(products ?? []),
      new Date().toISOString()
    ];

    if (existing) {
      await dbRun(
        `UPDATE salon_config
         SET name = ?, description = ?, phone = ?, email = ?, address = ?, hours = ?,
             logo = ?, coverPhoto = ?, primaryColor = ?, accentColor = ?, backgroundColor = ?,
             whatsapp = ?, calendarPublic = ?, workingHours = ?, blockedSlots = ?, vacations = ?,
             nailShapes = ?, nailLengths = ?, nailStyles = ?, products = ?, updatedAt = ?
         WHERE id = ?`,
        [...values, 'main']
      );
    } else {
      await dbRun(
        `INSERT INTO salon_config
         (id, name, description, phone, email, address, hours, logo, coverPhoto,
          primaryColor, accentColor, backgroundColor, whatsapp, calendarPublic,
          workingHours, blockedSlots, vacations, nailShapes, nailLengths, nailStyles, products, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ['main', ...values]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error guardando configuración:', err);
    res.status(500).json({ error: err.message });
  }
});

// SERVICIOS
app.get('/api/services', async (req, res) => {
  try {
    const services = await dbAll('SELECT * FROM services WHERE active = 1 ORDER BY sortOrder ASC, name ASC');
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { id, name, duration, price, description, shortDescription, longDescription, category, featured, sortOrder, instagramSource } = req.body;
    const now = new Date().toISOString();
    await dbRun(
      'INSERT INTO services (id, name, duration, price, description, shortDescription, longDescription, category, featured, sortOrder, instagramSource, updatedAt, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)',
      [id, name, duration ?? null, price ?? null, description || shortDescription || '', shortDescription || description || '', longDescription || '', category || 'diseno_personalizado', featured ? 1 : 0, Number(sortOrder) || 0, instagramSource || '@greenlanters.nails', now]
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const { name, duration, price, description, shortDescription, longDescription, category, featured, sortOrder, instagramSource } = req.body;
    await dbRun(
      'UPDATE services SET name = ?, duration = ?, price = ?, description = ?, shortDescription = ?, longDescription = ?, category = ?, featured = ?, sortOrder = ?, instagramSource = ?, updatedAt = ? WHERE id = ?',
      [name, duration ?? null, price ?? null, description || shortDescription || '', shortDescription || description || '', longDescription || '', category || 'diseno_personalizado', featured ? 1 : 0, Number(sortOrder) || 0, instagramSource || '@greenlanters.nails', new Date().toISOString(), req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await dbRun('UPDATE services SET active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ESPECIALISTAS
app.get('/api/specialists', async (req, res) => {
  try {
    const specialists = await dbAll('SELECT * FROM specialists WHERE active = 1');
    res.json(specialists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/specialists', async (req, res) => {
  try {
    const { id, name, role, photo, description } = req.body;
    
    await dbRun(
      'INSERT INTO specialists (id, name, role, photo, description, active) VALUES (?, ?, ?, ?, ?, 1)',
      [id, name, role, photo, description || '']
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/specialists/:id', async (req, res) => {
  try {
    const { name, role, photo, description } = req.body;
    
    await dbRun(
      'UPDATE specialists SET name = ?, role = ?, photo = ?, description = ? WHERE id = ?',
      [name, role, photo, description || '', req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/specialists/:id', async (req, res) => {
  try {
    await dbRun('UPDATE specialists SET active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== FEED PÚBLICO (para instagram-autopilot / servicios externos) ====================
// Ver I:\instagram-autopilot\INTEGRATION.md para el contrato de este endpoint.
app.get('/api/public/content-feed', async (req, res) => {
  try {
    const providedKey = req.header('x-api-key');
    if (process.env.CONTENT_FEED_API_KEY && providedKey !== process.env.CONTENT_FEED_API_KEY) {
      return res.status(401).json({ error: 'API key inválida' });
    }
    const photos = await dbAll('SELECT * FROM gallery ORDER BY displayOrder ASC, uploadedAt DESC');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const feed = photos.map((p) => ({
      id: `gallery_${p.id}`,
      type: 'gallery_photo',
      imageUrl: `${baseUrl}/api/gallery/${p.id}/image`,
      title: p.title || '',
      context: p.caption || 'Foto de la galería del salón',
      createdAt: p.uploadedAt,
      consent: true
    }));
    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sirve la foto de galería como imagen real (necesario para que Instagram/el
// servicio externo puedan descargarla por URL pblica, no vale el base64)
app.get('/api/gallery/:id/image', async (req, res) => {
  try {
    const photo = await dbGet('SELECT photoBase64 FROM gallery WHERE id = ?', [req.params.id]);
    if (!photo?.photoBase64) return res.status(404).send('Foto no encontrada');
    const match = photo.photoBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) return res.status(500).send('Formato de imagen no reconocido');
    const [, mime, base64Data] = match;
    res.set('Content-Type', mime);
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(Buffer.from(base64Data, 'base64'));
  } catch (err) {
    res.status(500).send('Error interno');
  }
});

// GALERA
app.get('/api/gallery', async (req, res) => {
  try {
    const photos = await dbAll('SELECT * FROM gallery ORDER BY displayOrder ASC');
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gallery', async (req, res) => {
  try {
    const { id, photoBase64, title, caption } = req.body;
    const order = await dbGet('SELECT MAX(displayOrder) as max FROM gallery');
    const displayOrder = (order?.max || 0) + 1;
    
    await dbRun(
      'INSERT INTO gallery (id, photoBase64, title, caption, uploadedAt, displayOrder) VALUES (?, ?, ?, ?, ?, ?)',
      [id, photoBase64, title || '', caption || '', new Date().toISOString(), displayOrder]
    );

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/gallery/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM gallery WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SOLICITUDES DE CITA
app.post('/api/booking-request', async (req, res) => {
  try {
    const { clientName, clientPhone, clientEmail, serviceType, preferredDate, preferredTime, notes, createdAt } = req.body;
    const id = Date.now().toString();
    
    await dbRun(
      `INSERT INTO booking_requests 
       (id, clientName, clientPhone, clientEmail, serviceType, preferredDate, preferredTime, notes, status, createdAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, clientName, clientPhone, clientEmail, serviceType, preferredDate, preferredTime, notes, 'Pendiente', createdAt]
    );

    sendEmail({
      to: clientEmail,
      subject: 'Hemos recibido tu solicitud de cita - Las Greenlanters Nails',
      templateName: 'booking-confirmation.html',
      vars: {
        clientName,
        serviceType: serviceType || 'tu servicio',
        preferredDate: preferredDate || 'a confirmar',
        preferredTime: preferredTime || 'a confirmar'
      }
    });

    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/booking-requests', async (req, res) => {
  try {
    const requests = await dbAll('SELECT * FROM booking_requests ORDER BY createdAt DESC');
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/booking-requests/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    await dbRun(
      'UPDATE booking_requests SET status = ?, respondedAt = ? WHERE id = ?',
      [status, new Date().toISOString(), req.params.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/booking-requests/:id', async (req, res) => {
  try {
    await dbRun('DELETE FROM booking_requests WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SALUD
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Frontend de producción: mismo origen que la API, compatible con Cloudflare/EasyPanel.
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Ruta API no encontrada' });
    }
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Inicializar y escuchar
initDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`INFO:a Servidor Express en puerto ${PORT}`);
    console.log(`INFO: API Base: http://localhost:${PORT}/api`);
    console.log(`INFO: Base de datos: ${dbPath}`);
  });
});


