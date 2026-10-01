# PLAN REUTILIZABLE — Motor de negocio

## Objetivo
Convertir la aplicación de Las Greenlanters Nails en un motor reutilizable para
otros negocios de servicios, separando motor, tenant, perfil, plantilla y UI.

## Arquitectura
- Frontend: React 19 + TypeScript + Vite.
- Backend: Express + SQLite.
- Persistencia: SQLite por instalación, con tenant_id en datos operativos.
- Auth Staff: scrypt + timingSafeEqual + token HMAC en sessionStorage.
- Contenido: content_blocks editable desde Cabina Staff.
- Perfil: src/config/businessProfile.ts.
- PWA: manifest + service worker, sin cachear API.

## Capas
1. Motor: autenticación, citas, servicios, especialistas, galería y API.
2. Tenant: TENANT_ID de entorno; siguiente evolución: resolver por host.
3. Perfil: identidad, contacto, redes y colores.
4. Plantilla: sector, labels y capacidades.
5. UI: web pública + Cabina Staff.
6. Integraciones: voz, chat, Instagram y acciones controladas.

## Modelo de datos
Las tablas operativas incluyen tenant_id:
appointments, custom_designs, salon_config, services, specialists,
booking_requests, gallery y content_blocks.

La capa scopeTenantQuery() añade el tenant a SELECT/INSERT/UPDATE/DELETE.
Las migraciones actuales añaden la columna sin destruir datos existentes.

## Contrato API
### Público
- GET /api/health
- GET /api/content
- GET /api/services
- GET /api/specialists
- GET /api/gallery
- POST /api/booking-request
- GET /api/config
- GET /api/public/content-feed

### Staff protegido
- GET /api/appointments
- POST/PUT/DELETE /api/appointments/:id
- GET /api/designs
- POST/PUT/DELETE /api/designs/:id
- POST/PUT/DELETE /api/content/:id
- PUT /api/config
- POST/PUT/DELETE /api/services/:id
- POST/PUT/DELETE /api/specialists/:id
- POST/DELETE /api/gallery/:id
- GET/PUT/DELETE /api/booking-requests/:id

### Auth
- GET /api/staff/status
- POST /api/staff/setup-password
- POST /api/staff/login
- POST /api/staff/change-password

## Reutilización
Para crear otro negocio:
1. Cambiar businessProfile.
2. Definir labels y sector.
3. Configurar colores, logo y contacto.
4. Sembrar content_blocks y servicios del tenant.
5. Configurar TENANT_ID.
6. Mantener el motor y las rutas API.

## Resolución multi-tenant futura
La instalación actual usa TENANT_ID desde entorno para aislar datos.
La evolución SaaS debe resolver el tenant por hostname/subdominio o credencial
del negocio, validarlo en middleware y evitar aceptar tenant_id desde el cliente.

Debe añadirse un índice por tenant en consultas de alto volumen y restricciones
compuestas donde una clave solo deba ser única dentro del negocio.

## Migraciones
Las migraciones deben ser idempotentes y ejecutarse al arrancar o mediante un
comando explícito de despliegue. Antes de migrar una base SQLite se conserva
backup verificable con PRAGMA integrity_check.

## Seguridad
- STAFF_TOKEN_SECRET es obligatorio en producción y debe ser persistente.
- El token Staff incorpora tenantId y el middleware rechaza tokens de otro tenant.
- El login tiene lockout temporal tras 5 intentos fallidos en una ventana de 15 minutos.
- No se acepta tenant_id desde el frontend.
- Pendiente: rotación/revocación de tokens.
- Pendiente: validación de payloads y límites de tamaño para imágenes.

## Próximas tandas
- Modularizar AdminPanel en componentes por dominio.
- Completar UI mobile-first de Staff.
- Acciones JSON controladas para conversación.
- Voz/chat sobre acciones autorizadas.
- Instagram Graph API y fallback.
- Tests automatizados.
- Deployment.md y procedimiento EasyPanel.
