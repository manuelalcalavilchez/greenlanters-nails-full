import React, { useEffect, useMemo, useState } from 'react';
import { Bot, MessageCircle, Send, X } from 'lucide-react';
import { businessProfile } from '../config/businessProfile';
import { chatbotConfig, chatbotQuickActions } from '../config/chatbotConfig';
import '../styles/chatbot.css';

type Service = { name?: string; price?: number | string; shortDescription?: string; description?: string };
type SalonConfig = { phone?: string; whatsapp?: string; address?: string; hours?: string; description?: string };
type Message = { role: 'user' | 'assistant'; text: string };
type Props = { setActiveTab?: (tab: string) => void };

export function GreenlantersChatbot({ setActiveTab }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: chatbotConfig.welcome }
  ]);
  const [services, setServices] = useState<Service[]>([]);
  const [config, setConfig] = useState<SalonConfig>({});

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
      addAssistant('Puedes contactar con el salón desde el botón de contacto de la web.');
      return;
    }
    const text = encodeURIComponent('Hola, vengo de la web de Las Greenlanters Nails y me gustaría pedir información.');
    window.open('https://wa.me/' + whatsapp + '?text=' + text, '_blank', 'noopener,noreferrer');
  };

  const answerLocal = (question: string) => {
    const q = question.toLowerCase();
    if (q.includes('servicio') || q.includes('precio') || q.includes('cuesta') || q.includes('gel') || q.includes('polygel')) {
      if (services.length) {
        return services.slice(0, 8).map(s => '• ' + (s.name || 'Servicio') + (s.price !== undefined && s.price !== null ? ' — ' + s.price + ' €' : '')).join('\n');
      }
      return 'Puedo enseñarte los servicios disponibles en la sección de servicios de la web. Si quieres un precio concreto, escríbeme el nombre del servicio.';
    }
    if (q.includes('hora') || q.includes('abierto') || q.includes('horario')) {
      return config.hours || 'Los horarios aparecen en la información del negocio. Si necesitas una hora concreta, podemos continuar por WhatsApp.';
    }
    if (q.includes('dónde') || q.includes('donde') || q.includes('dirección') || q.includes('ubicación')) {
      return config.address || 'Estamos en ' + businessProfile.location + '. Puedes pedir la ubicación exacta por WhatsApp.';
    }
    if (q.includes('reserva') || q.includes('cita') || q.includes('apuntar')) {
      return 'Claro 💚. Puedes solicitar una cita desde el botón de reserva de la web o continuar por WhatsApp.';
    }
    if (q.includes('regalo') || q.includes('tarjeta')) {
      return 'Sí, la web dispone de tarjetas regalo. Puedes consultar la sección de tarjetas regalo o preguntarme qué necesitas.';
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
      services: '¿Qué servicios y precios tenéis?',
      hours: '¿Cuál es vuestro horario?',
      location: '¿Dónde está el salón?',
      gift: '¿Tenéis tarjetas regalo?'
    };
    const text = textById[id];
    if (text) handleSend(text);
  };

  const handleSend = async (preset?: string) => {
    const question = (preset || input).trim();
    if (!question || typing) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: question }]);
    setTyping(true);

    try {
      if (chatbotConfig.aiEnabled) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: question,
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
      addAssistant(local || 'Puedo ayudarte con servicios, precios, horarios, ubicación, reservas y tarjetas regalo. También puedes hablar directamente por WhatsApp.');
    } catch {
      addAssistant(answerLocal(question) || 'Ahora mismo no puedo consultar el asistente inteligente. Puedes continuar por WhatsApp.');
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
            {typing && <div className="gl-chat-message assistant">Escribiendo…</div>}
          </div>

          <div className="gl-chat-actions">
            {chatbotQuickActions.map(action => (
              <button key={action.id} onClick={() => handleAction(action.id)}>{action.label}</button>
            ))}
          </div>

          <form className="gl-chat-input" onSubmit={e => { e.preventDefault(); handleSend(); }}>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe tu pregunta…" />
            <button type="submit" aria-label="Enviar"><Send size={18} /></button>
          </form>
        </section>
      )}
    </>
  );
}
