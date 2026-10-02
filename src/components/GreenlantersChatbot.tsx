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
    const hasPriceData = services.some(s => s.price !== undefined && s.price !== null && s.price !== '');
    const gelService = findService(q, ['gel']);
    const polygelService = findService(q, ['polygel', 'poli gel']);

    if (q.includes('hola') || q.includes('buenas') || q.includes('hey')) {
      return '¡Holaaa! 💚 Cuéntame, ¿qué te apetece hacerte? Si tienes una idea en mente, aunque sea un poco loca, también me vale 😄';
    }

    if ((q.includes('diferencia') || q.includes('compar') || q.includes('mejor')) && (q.includes('gel') || q.includes('polygel') || q.includes('poli gel'))) {
      return 'La diferencia principal es que gel y poligel son técnicas/productos distintos para trabajar y dar estructura a la uña. 💚 En la web tengo ambos como servicios, pero no tengo cargada una explicación técnica detallada de cada uno como para decirte cuál te conviene más sin inventar. Si me cuentas qué buscas —por ejemplo, longitud, resistencia o un acabado concreto— te puedo orientar con lo que sí tenemos disponible.';
    }

    if ((q.includes('que es') || q.includes('qué es') || q.includes('como es') || q.includes('en que consiste') || q.includes('para que sirve')) && (q.includes('polygel') || q.includes('poli gel'))) {
      const description = polygelService?.description || polygelService?.shortDescription;
      return description
        ? `El poligel es un servicio que tenemos en el salón. 😊 En la ficha aparece así: “${description}”. Si quieres, también te puedo contar la diferencia con el gel.`
        : 'El poligel es una técnica/producto para trabajar y dar estructura a la uña. 😊 No tengo una descripción más detallada cargada en la web y prefiero no inventártela.';
    }

    if ((q.includes('que es') || q.includes('qué es') || q.includes('como es') || q.includes('en que consiste') || q.includes('para que sirve')) && q.includes('gel')) {
      const description = gelService?.description || gelService?.shortDescription;
      return description
        ? `Las uñas en gel son un servicio que tenemos en el salón. 😊 En la ficha aparece así: “${description}”. Si quieres, también te puedo contar la diferencia con el poligel.`
        : 'Las uñas en gel son una técnica/producto para trabajar y dar estructura a la uña. 😊 No tengo una descripción más detallada cargada en la web y prefiero no inventártela.';
    }

    if (q.includes('mas barato') || q.includes('más barato') || q.includes('barato') || q.includes('cuanto cuesta') || q.includes('cuánto cuesta') || q.includes('que precio') || q.includes('qué precio') || q.includes('precio')) {
      const specific = q.includes('polygel') || q.includes('poli gel') ? polygelService : q.includes('gel') ? gelService : undefined;
      if (specific?.price !== undefined && specific?.price !== null && specific.price !== '') {
        return `El servicio de ${specific.name || 'ese tipo de uñas'} aparece ahora mismo a ${specific.price} €. 😊`;
      }
      if ((q.includes('mas barato') || q.includes('barato')) && hasPriceData) {
        const priced = services.filter(s => s.price !== undefined && s.price !== null && s.price !== '').map(s => ({ ...s, numericPrice: Number(String(s.price).replace(',', '.')) })).filter(s => Number.isFinite(s.numericPrice));
        if (priced.length) {
          const min = Math.min(...priced.map(s => s.numericPrice));
          const cheapest = priced.filter(s => s.numericPrice === min).map(s => s.name || 'Servicio').join(' y ');
          return `De los servicios que tienen precio cargado, el más económico es ${cheapest}, a ${min} €. 💚`;
        }
      }
      return 'Ahora mismo no tengo cargado el precio de ese servicio en la web, así que prefiero no inventártelo 😅. Si quieres saber el precio exacto, puedes consultarlo con el salón por WhatsApp.';
    }

    if (q.includes('diseño') && (q.includes('foto') || q.includes('fotos') || q.includes('imagen') || q.includes('referencia') || q.includes('inspiracion') || q.includes('inspiración'))) {
      return 'Sí 💚 Una foto de referencia puede servir para enseñar el diseño que buscas. Para saber si se puede reproducir tal cual y cuánto costaría, lo ideal es que el salón vea la imagen, porque puede depender de la técnica y de lo elaborado que sea.';
    }

    if (q.includes('servicio') || q.includes('que teneis') || q.includes('qué tenéis') || q.includes('que ofreceis') || q.includes('qué ofrecéis')) {
      if (services.length) {
        return 'Claro 😊 Ahora mismo tengo estos servicios:\n\n' + formatServices() + '\n\nSi me dices qué quieres hacerte, te ayudo a orientarte.';
      }
      return 'Ahora mismo no tengo el catálogo cargado. Si me dices qué tienes en mente, puedo orientarte o ponerte en contacto con el salón.';
    }

    if (q.includes('hora') || q.includes('abierto') || q.includes('horario')) {
      return config.hours
        ? 'Sí 😊 El horario que tengo ahora mismo es:\n\n' + config.hours
        : 'Déjame no inventarte un horario 😅. Si necesitas saber si están disponibles a una hora concreta, lo mejor es hablar con el salón por WhatsApp.';
    }
    if (q.includes('donde') || q.includes('dirección') || q.includes('ubicación')) {
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
