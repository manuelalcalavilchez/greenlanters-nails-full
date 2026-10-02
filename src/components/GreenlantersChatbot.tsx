import React, { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { businessProfile } from '../config/businessProfile';
import { chatbotConfig, chatbotQuickActions } from '../config/chatbotConfig';
import '../styles/chatbot.css';

type Service = { name?: string; price?: number | string; shortDescription?: string; description?: string };
type SalonConfig = { phone?: string; whatsapp?: string; address?: string; hours?: string; description?: string };
type Message = { role: 'user' | 'assistant'; text: string };
type Props = { setActiveTab?: (tab: string) => void };

const HISTORY_KEY = 'greenlanters-chat-history-v3';
const MAX_HISTORY = 14;

const starterMessage = (): Message => ({
  role: 'assistant',
  text: chatbotConfig.welcome
});

export function GreenlantersChatbot({ setActiveTab }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(HISTORY_KEY) || 'null');
      return Array.isArray(saved) && saved.length ? saved : [starterMessage()];
    } catch {
      return [starterMessage()];
    }
  });
  const [services, setServices] = useState<Service[]>([]);
  const [config, setConfig] = useState<SalonConfig>({});

  useEffect(() => {
    sessionStorage.setItem(HISTORY_KEY, JSON.stringify(messages.slice(-MAX_HISTORY)));
  }, [messages]);

  useEffect(() => {
    Promise.all([
      fetch('/api/services').then(r => r.ok ? r.json() : []),
      fetch('/api/config').then(r => r.ok ? r.json() : {})
    ]).then(([svc, cfg]) => {
      setServices(Array.isArray(svc) ? svc : []);
      setConfig(cfg || {});
    }).catch(() => {});
  }, []);

  const whatsapp = useMemo(() => {
    const raw = config.whatsapp || chatbotConfig.whatsappNumber || config.phone || '';
    const digits = raw.replace(/\D/g, '');
    return digits ? (digits.startsWith('34') ? digits : '34' + digits) : '';
  }, [config]);

  const addAssistant = (text: string) => {
    setMessages(prev => [...prev, { role: 'assistant', text }]);
  };

  const sendWhatsApp = () => {
    if (!whatsapp) {
      addAssistant('Si quieres hablar directamente con el salón, puedes usar el botón de contacto de la web 💚');
      return;
    }
    const text = encodeURIComponent('Hola, vengo de la web de Las Greenlanters Nails 😊');
    window.open('https://wa.me/' + whatsapp + '?text=' + text, '_blank', 'noopener,noreferrer');
  };
  const normalize = (value: string) => value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const findService = (q: string, terms: string[]) => services.find(s => {
    const name = normalize(s.name || '');
    return terms.some(term => name.includes(term) || q.includes(term));
  });

  const formatServices = () => services.slice(0, 8).map(s => {
    const name = s.name || 'Servicio';
    const price = s.price !== undefined && s.price !== null && s.price !== '' ? ` — ${s.price} €` : '';
    return '• ' + name + price;
  }).join('\n');

  const answerLocal = (question: string) => {
    const q = normalize(question);
    const isAboutGel = q.includes('gel');
    const isAboutPolygel = q.includes('polygel') || q.includes('poli gel');
    const isQuestion = q.includes('?') || q.startsWith('que ') || q.startsWith('como ') || q.startsWith('cual ');

    if (q.includes('hola') || q.includes('buenas') || q.includes('hey') || q === 'buenos dias' || q === 'buenas tardes') {
      return '¡Holaaa! 💚 ¿Qué tienes en mente? Cuéntame y lo vemos juntas.';
    }

    if (q.includes('gracias') || q.includes('perfecto') || q.includes('genial') || q.includes('vale')) {
      return '¡Eso es! 💚 Si quieres seguimos mirando y te ayudo a decidir.';
    }

    if ((q.includes('diferencia') || q.includes('compar') || q.includes('mejor')) && isAboutGel && isAboutPolygel) {
      return 'Son dos formas distintas de dar estructura a la uña. El gel suele dejar una sensación más ligera y el poligel combina parte de la flexibilidad del gel con más cuerpo para trabajar la forma. 💚 Si me dices si buscas algo más natural, más resistente o más largo, te digo por dónde empezaría.';
    }

    if (isAboutPolygel && (q.includes('que es') || q.includes('como es') || q.includes('en que consiste') || q.includes('para que sirve') || isQuestion)) {
      return 'El poligel es un material para construir y dar forma a la uña. Queda muy bien cuando quieres ganar estructura o longitud sin que resulte tan rígido como algunos sistemas de construcción. 😊 ¿Buscas alargar tus uñas o reforzar las que ya tienes?';
    }

    if (isAboutGel && !isAboutPolygel && (q.includes('que es') || q.includes('como es') || q.includes('en que consiste') || q.includes('para que sirve') || isQuestion)) {
      return 'Las uñas de gel se trabajan con un producto que permite construir o reforzar la uña y darle la forma que buscas. Es una opción muy versátil, tanto para algo natural como para llevar más longitud. 💚 ¿Las quieres cortitas y naturales o te apetece algo más largo?';
    }

    if ((q.includes('precio') || q.includes('cuanto cuesta') || q.includes('barato')) && (isAboutGel || isAboutPolygel)) {
      const service = isAboutPolygel ? findService(q, ['polygel', 'poli gel']) : findService(q, ['gel']);
      if (service?.price !== undefined && service?.price !== null && service.price !== '') {
        return `Para ${service.name || (isAboutPolygel ? 'poligel' : 'gel')}, ahora mismo son ${service.price} €. 😊`;
      }
      return 'El precio puede cambiar según lo que quieras hacerte, sobre todo si lleva longitud o diseño. Si me cuentas qué tienes pensado, te digo cómo lo plantearía; para un precio cerrado, mejor que el salón vea el diseño.';
    }

    if (q.includes('precio') || q.includes('cuanto cuesta') || q.includes('barato')) {
      const priced = services
        .filter(s => s.price !== undefined && s.price !== null && s.price !== '')
        .map(s => ({ ...s, numericPrice: Number(String(s.price).replace(',', '.')) }))
        .filter(s => Number.isFinite(s.numericPrice));
      if (q.includes('barato') && priced.length) {
        const min = Math.min(...priced.map(s => s.numericPrice));
        const names = priced.filter(s => s.numericPrice === min).map(s => s.name || 'ese servicio').join(' o ');
        return `Si buscas algo económico, el servicio que aparece con el precio más bajo es ${names}, a ${min} €. 💚`;
      }
      return 'Claro 😊 Dime qué te quieres hacer —gel, poligel, semipermanente, diseño…— y te digo el precio que tenemos para ese servicio.';
    }

    if (q.includes('foto') || q.includes('fotos') || q.includes('imagen') || q.includes('referencia') || q.includes('inspiracion')) {
      return '¡Sí, pásame la idea! 😍 Una referencia ayuda muchísimo. Si el diseño lleva dibujos, efectos o bastante detalle, el precio puede depender de cómo haya que trabajarlo. Si quieres enseñárselo directamente al salón, también puedes mandarlo por WhatsApp.';
    }

    if (q.includes('servicio') || q.includes('que teneis') || q.includes('que ofreceis') || q.includes('catalogo')) {
      if (!services.length) return 'Cuéntame qué resultado buscas y te ayudo a encontrar una opción que encaje contigo. 💚';
      return 'Claro 😊 Tenemos estas opciones ahora mismo:\n\n' + formatServices() + '\n\nSi me dices qué resultado buscas, también te ayudo a elegir.';
    }

    if (q.includes('hora') || q.includes('abierto') || q.includes('horario')) {
      return config.hours
        ? 'Nuestro horario es:\n\n' + config.hours + '\n\nSi quieres venir un día concreto, dime cuál y vemos el siguiente paso 😊'
        : 'Dime qué día quieres venir y, para confirmarte disponibilidad, lo mejor es hablar directamente con el salón.';
    }

    if (q.includes('donde') || q.includes('direccion') || q.includes('ubicacion')) {
      return config.address
        ? `Estamos en 📍 ${config.address}`
        : `Estamos en ${businessProfile.location}. Para la dirección exacta, te la paso por WhatsApp.`;
    }

    if (q.includes('reserva') || q.includes('cita') || q.includes('apuntar')) {
      return '¡Claro! 💚 Puedes reservar desde la web. ¿Sabes ya qué servicio quieres o estás todavía mirando ideas?';
    }

    if (q.includes('regalo') || q.includes('tarjeta')) {
      return 'Sí 🎁 Las tarjetas regalo son una opción muy chula si es para regalar una manicura. Si quieres, te indico dónde verlas en la web.';
    }

    return '';
  };

  const handleAction = (id: string) => {
    if (id === 'whatsapp') return sendWhatsApp();
    if (id === 'booking') {
      setOpen(false);
      setActiveTab?.('booking');
      return;
    }
    const textById: Record<string, string> = {
      services: '¿Qué servicios tenéis?',
      hours: '¿Cuál es vuestro horario?',
      location: '¿Dónde está el salón?',
      gift: '¿Tenéis tarjetas regalo?'
    };
    const text = textById[id];
    if (text) handleSend(text);
  };
  const handleSend = async (preset?: string) => {
    const question = (preset || input).trim().slice(0, 1200);
    if (!question || typing) return;
    setInput('');
    const nextMessages = [...messages, { role: 'user' as const, text: question }];
    setMessages(nextMessages);
    setTyping(true);

    try {
      if (chatbotConfig.aiEnabled) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
            history: nextMessages.slice(-MAX_HISTORY),
            business: businessProfile,
            services,
            config
          })
        });
        if (response.ok) {
          const data = await response.json();
          if (data.answer) {
            addAssistant(data.answer);
            return;
          }
        }
      }
      const local = answerLocal(question);
      addAssistant(local || chatbotConfig.fallbackMessage);
    } catch {
      addAssistant(answerLocal(question) || chatbotConfig.fallbackMessage);
    } finally {
      setTyping(false);
    }
  };

  if (!chatbotConfig.enabled) return null;

  return (
    <>
      <button className="gl-chat-launcher" onClick={() => setOpen(v => !v)} aria-label="Abrir asistente">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && <span>¿Te ayudo?</span>}
      </button>

      {open && (
        <section className="gl-chat-panel" aria-label="Asistente de Las Greenlanters Nails">
          <header className="gl-chat-header">
            <div className="gl-chat-avatar"><Bot size={22} /></div>
            <div>
              <strong>{chatbotConfig.assistantName}</strong>
              <small>Las Greenlanters Nails · Almería</small>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar"><X size={19} /></button>
          </header>

          <div className="gl-chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={'gl-chat-message ' + m.role}>
                {m.text.split('\n').map((line, n) => <React.Fragment key={n}>{n > 0 && <br />}{line}</React.Fragment>)}
              </div>
            ))}
            {typing && <div className="gl-chat-message assistant gl-chat-typing"><span>•</span><span>•</span><span>•</span></div>}
          </div>
          <div className="gl-chat-actions">
            {chatbotQuickActions.map(action => (
              <button key={action.id} onClick={() => handleAction(action.id)}>{action.label}</button>
            ))}
          </div>

          <form className="gl-chat-input" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Cuéntame qué tienes en mente…"
              aria-label="Escribe tu mensaje"
            />
            <button type="submit" aria-label="Enviar"><Send size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
