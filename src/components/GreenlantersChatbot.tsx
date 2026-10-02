import React, { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { businessProfile } from '../config/businessProfile';
import { chatbotConfig, chatbotQuickActions } from '../config/chatbotConfig';
import '../styles/chatbot.css';

type Service = { name?: string; price?: number | string; shortDescription?: string; description?: string };
type SalonConfig = { phone?: string; whatsapp?: string; address?: string; hours?: string; description?: string };
type Message = { role: 'user' | 'assistant'; text: string };
type Props = { setActiveTab?: (tab: string) => void };

const HISTORY_KEY = 'greenlanters-chat-history-v2';
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
  const answerLocal = (question: string) => {
    const q = question.toLowerCase();
    if (q.includes('hola') || q.includes('buenas') || q.includes('hey')) {
      return '¡Holaaa! 💚 Cuéntame, ¿qué te apetece hacerte? Si tienes una idea en mente, aunque sea un poco loca, también me vale 😄';
    }
    if (q.includes('servicio') || q.includes('precio') || q.includes('cuesta') || q.includes('gel') || q.includes('polygel')) {
      if (services.length) {
        return 'Claro 😊 Ahora mismo tengo estos servicios:\n\n' +
          services.slice(0, 8).map(s => '• ' + (s.name || 'Servicio') +
          (s.price !== undefined && s.price !== null ? ' — ' + s.price + ' €' : '')).join('\n') +
          '\n\nSi me dices qué quieres hacerte, te ayudo a orientarte.';
      }
      return 'Claro 😊 Dime qué tipo de uñas tienes en mente y te cuento lo que puedo encontrar en la web. Si buscas un precio concreto, prefiero comprobarlo antes que inventármelo.';
    }
    if (q.includes('hora') || q.includes('abierto') || q.includes('horario')) {
      return config.hours
        ? 'Sí 😊 El horario que tengo ahora mismo es:\n\n' + config.hours
        : 'Déjame no inventarte un horario 😅. Si necesitas saber si están disponibles a una hora concreta, lo mejor es hablar con el salón por WhatsApp.';
    }
    if (q.includes('dónde') || q.includes('donde') || q.includes('dirección') || q.includes('ubicación')) {
      return config.address
        ? 'Estamos por aquí 📍\n\n' + config.address
        : 'El salón está en ' + businessProfile.location + '. Si quieres la dirección exacta, te la puedo facilitar por WhatsApp.';
    }
    if (q.includes('reserva') || q.includes('cita') || q.includes('apuntar')) {
      return '¡Claro! 💚 Puedes reservar desde la web. Si me cuentas qué servicio quieres y, si ya lo sabes, qué día te viene bien, te voy guiando.';
    }
    if (q.includes('regalo') || q.includes('tarjeta')) {
      return 'Sí 🎁 Tenemos la opción de tarjetas regalo. Si quieres, te explico dónde encontrarla en la web.';
    }
    if (q.includes('gracias') || q.includes('perfecto') || q.includes('genial')) {
      return '¡De nada! 💚 Para eso estoy. Si se te ocurre otra cosa, aquí me tienes.';
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
      services: 'Quiero saber qué servicios tenéis y cuánto cuestan.',
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
