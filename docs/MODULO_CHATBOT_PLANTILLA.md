# Módulo Chatbot — Plantilla reutilizable

## Objetivo

El chatbot es un módulo opcional del motor reutilizable. Su objetivo no es parecer un formulario automático, sino atender como una persona cercana del salón.

## Personalidad humana

La personalidad actual se llama **Lía** y está definida en `src/config/chatbotConfig.ts`.

Principios:
- español natural de España;
- tono cercano, cálido y espontáneo;
- frases variadas y conversación real;
- preguntas de seguimiento cuando aportan valor;
- humor suave y emojis puntuales;
- evita saludos y frases repetidas;
- no se presenta como IA ni menciona prompts;
- no inventa información del negocio.

La personalidad está separada de los datos del negocio para poder reutilizar el módulo en otros clientes.

## Memoria conversacional

El navegador mantiene la conversación durante la sesión mediante `sessionStorage`.

Clave utilizada:
`greenlanters-chat-history-v2`

Se conservan como máximo 14 mensajes recientes. El historial se envía a `POST /api/chat` para que Gemini pueda mantener el contexto.

Ejemplo:
- clienta: «Tengo una boda el sábado.»
- clienta: «Voy de verde.»
- Lía puede continuar hablando del color sin volver a preguntar por el evento.

La memoria es de sesión y no sustituye a una base de datos de clientes.

## Inteligencia artificial

El frontend utiliza `POST /api/chat`.

El servidor utiliza Gemini solamente si existe `GEMINI_API_KEY`.
El modelo se controla mediante `GEMINI_MODEL` y por defecto es `gemini-2.5-flash`.

El servidor envía una instrucción de personalidad separada del historial y del contexto del negocio.

Reglas:
- no inventar precios, horarios, disponibilidad o políticas;
- no confirmar reservas sin una acción real confirmada;
- reconocer cuando falta información;
- ofrecer WhatsApp o reserva web cuando corresponda;
- no dar consejos médicos ni legales.

## Respuesta local de respaldo

Si Gemini no está configurado o falla, el asistente sigue conversando mediante respuestas locales.

El fallback incluye:
- saludos;
- servicios y precios disponibles;
- horarios;
- ubicación;
- reservas;
- tarjetas regalo;
- agradecimientos.

El fallback también utiliza un tono humano y no un mensaje técnico de error.

## Interfaz

El panel mantiene la identidad visual Greenlanters:
- verde profundo;
- verde neón;
- crema;
- burbujas diferenciadas para clienta y asistente;
- indicador de escritura animado;
- entrada con placeholder conversacional.

## Archivos

- `src/components/GreenlantersChatbot.tsx`: interfaz, memoria de sesión y conversación.
- `src/config/chatbotConfig.ts`: personalidad y configuración.
- `src/styles/chatbot.css`: apariencia.
- `server.js`: endpoint de IA y personalidad del servidor.
- este documento: arquitectura y reglas reutilizables.

## Seguridad

La clave de Gemini permanece exclusivamente en el servidor.

Nunca colocar `GEMINI_API_KEY` en React ni enviarla al navegador.

El endpoint limita el mensaje a 1.200 caracteres y el historial a 14 mensajes.

## WhatsApp y reservas

WhatsApp utiliza la configuración del negocio y se normaliza para España cuando no existe prefijo internacional.

El botón de reserva utiliza la navegación existente de la aplicación.

El chatbot nunca debe afirmar que una cita está confirmada si la aplicación no ha realizado y confirmado esa operación.

## Modelo white-label

Para otro cliente:

1. Copiar la plantilla.
2. Crear su `businessProfile`.
3. Cambiar personalidad y nombre del asistente.
4. Configurar identidad visual.
5. Cargar servicios y contenido.
6. Configurar teléfono y WhatsApp.
7. Decidir si se activa IA.
8. Probar conversación y fallback.
9. Probar reservas y contacto.
10. Desplegar.

## Regla de diseño

**Persona + memoria de sesión + conocimiento real del negocio + acciones reales.**

El chatbot debe sentirse humano sin inventar capacidades que la web no tiene.
