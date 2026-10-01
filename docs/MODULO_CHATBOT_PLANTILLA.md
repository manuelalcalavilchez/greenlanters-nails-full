# Módulo Chatbot — Plantilla reutilizable

## Objetivo

El chatbot es un módulo opcional del motor reutilizable. Puede activarse para un negocio y desactivarse para otro sin cambiar el componente principal.

## Archivos

- `src/components/GreenlantersChatbot.tsx`: interfaz y conversación.
- `src/config/chatbotConfig.ts`: configuración del módulo.
- `src/styles/chatbot.css`: apariencia visual.
- `server.js`: endpoint `POST /api/chat`.
- `docs/MANUAL_PROPIETARIA_CHATBOT.md`: manual de uso de la propietaria.

## Activación

En `chatbotConfig.ts`:

`enabled: true`

Para una instalación que no quiera chatbot:

`enabled: false`

## Configuración por cliente

Cambiar:
- nombre del asistente;
- mensaje de bienvenida;
- número de WhatsApp;
- activación de IA.

Los datos operativos se obtienen de:
- `/api/services`;
- `/api/config`;
- `businessProfile`.

Esto permite reutilizar el componente sin copiar la lógica de cada cliente.

## Inteligencia artificial

El frontend intenta usar `POST /api/chat`.

El servidor utiliza Gemini solamente si existe `GEMINI_API_KEY`.

El modelo se controla con `GEMINI_MODEL` y, si no se especifica, se usa `gemini-2.5-flash`.

Si la IA no está configurada o falla, el chatbot utiliza respuestas locales de respaldo.

## Seguridad

La clave de Gemini permanece exclusivamente en el servidor.

Nunca debe colocarse `GEMINI_API_KEY` en código React ni enviarse al navegador.

El endpoint limita el mensaje recibido a 1.200 caracteres y no expone secretos.

## WhatsApp

El chatbot obtiene primero `whatsapp` desde la configuración del negocio y utiliza `phone` como respaldo.

El número se normaliza para España cuando no contiene prefijo internacional.

## Reservas

El botón de reserva utiliza la navegación existente de la aplicación y abre la vista `booking`.

El chatbot no confirma una reserva por sí mismo.

## Modelo mayorista / white-label

Para un nuevo cliente:

1. Copiar la plantilla.
2. Crear su `businessProfile`.
3. Configurar identidad y colores.
4. Cargar servicios y contenido.
5. Configurar teléfono y WhatsApp.
6. Decidir si se activa el chatbot.
7. Configurar Gemini si el cliente quiere IA.
8. Probar servicios, contacto, reserva y chatbot.
9. Crear dominio y desplegar.

## Qué puede venderse como extra

- Chatbot básico con respuestas locales.
- Chatbot con IA.
- Integración con WhatsApp.
- Integración con reservas.
- Base de conocimiento personalizada.
- Automatizaciones posteriores.

## Mantenimiento

El núcleo del chatbot debe actualizarse en la plantilla maestra.

Los datos propios del negocio deben permanecer en configuración, contenido y base de datos.

No se recomienda duplicar código para cada cliente.

## Regla de oro

**Motor común + configuración independiente + módulos opcionales.**

Así una actualización del chatbot puede aplicarse a múltiples instalaciones sin reconstruir cada web desde cero.
