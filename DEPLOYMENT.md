# Deployment — Motor reutilizable

## 1. Variables obligatorias

Configurar en el entorno del servicio:

- `PORT`: puerto interno de Express.
- `DATA_DIR`: directorio persistente de SQLite.
- `TENANT_ID`: identificador del tenant de la instalación.
- `STAFF_TOKEN_SECRET`: secreto persistente y aleatorio para firmar sesiones Staff.

No guardar secretos en Git.

## 2. Persistencia

El directorio de `DATA_DIR` debe estar en almacenamiento persistente. La base es:

`DATA_DIR/greenlanters.db`

Antes de una migración o despliegue que modifique el esquema:

1. Crear copia de seguridad de SQLite.
2. Ejecutar `PRAGMA integrity_check`.
3. Desplegar.
4. Verificar `GET /api/health`.
5. Comprobar login Staff y lectura de datos.

## 3. EasyPanel

Crear o actualizar el servicio con:

- Build de la aplicación React.
- Proceso Node que ejecute el servidor Express.
- Volumen persistente para `DATA_DIR`.
- Variables de entorno configuradas en el panel.
- HTTPS gestionado por el proxy de EasyPanel.

No sustituir el volumen de datos al cambiar la imagen.

## 4. Primera puesta en marcha Staff

La contraseña inicial no está predefinida.

El primer acceso debe utilizar:

`POST /api/staff/setup-password`

Después se utiliza:

`POST /api/staff/login`

El token se conserva en `sessionStorage` del navegador y se envía como:

`Authorization: Bearer <token>`

## 5. Multi-tenant

La instalación actual selecciona el tenant mediante `TENANT_ID`.

No aceptar `tenant_id` procedente del navegador para seleccionar datos. En una evolución SaaS, la resolución debe hacerse en backend mediante hostname/subdominio o credencial del negocio.

## 6. Verificación post-despliegue

Comprobar:

- `GET /api/health` devuelve estado correcto.
- La web pública carga.
- Los servicios y especialistas aparecen.
- La solicitud pública de cita funciona.
- Staff exige autenticación.
- Una escritura sin Bearer devuelve `401`.
- Con sesión Staff se pueden modificar contenidos.
- Los datos sobreviven a un reinicio del contenedor.
- El tenant configurado no ve datos de otro tenant.

## 7. Seguridad pendiente

Antes de considerar una instalación SaaS multi-tenant como producción endurecida:

- Rate limit/lockout para login.
- Rotación y revocación de tokens.
- Validación estricta de payloads.
- Límites de tamaño y tipo para imágenes.
- Índices por `tenant_id` en tablas de alto volumen.
- Resolución de tenant por hostname/subdominio.
- `STAFF_TOKEN_SECRET` obligatorio en producción.
