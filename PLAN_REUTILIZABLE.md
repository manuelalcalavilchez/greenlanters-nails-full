# PLAN REUTILIZABLE — Motor de negocio

## Estado actual
- React 19 + TypeScript + Vite.
- Express + SQLite.
- Cabina Staff con autenticación backend por scrypt + token HMAC.
- Primer acceso sin contraseña predefinida.
- Editor de contenidos persistente en SQLite.
- tenant_id preparado en las tablas operativas y aplicado automáticamente por la capa SQL.
- TENANT_ID configurable por entorno.

## Capas
1. Motor: autenticación, citas, servicios, especialistas, galería, contenidos y API.
2. Tenant: identificación del negocio mediante TENANT_ID.
3. Perfil: nombre, logo, colores, contacto, horarios y redes.
4. Plantilla: etiquetas, tipos de bloques y capacidades activadas.
5. UI: Cabina Staff mobile-first.
6. Conversación: texto/voz que termina en acciones API controladas.

## Aislamiento
Las tablas operativas incluyen tenant_id. La función scopeTenantQuery() aplica el tenant a SELECT/INSERT/UPDATE/DELETE.

## Contenido
content_blocks permite bloques hero, section, cta, social y futuros tipos. El Staff edita mediante API; la persistencia no depende de localStorage.

## Siguientes fases
- Conectar Home pública a content_blocks.
- BusinessTemplate y labels sectoriales.
- Modularizar AdminPanel.
- PWA.
- Voz/chat sobre acciones controladas.
- Instagram como proveedor de imágenes.
- Tests automatizados.
- Despliegue Easypanel.
