export interface ChatbotConfig {
  enabled: boolean;
  assistantName: string;
  welcome: string;
  whatsappNumber: string;
  fallbackMessage: string;
  aiEnabled: boolean;
}

export const chatbotConfig: ChatbotConfig = {
  enabled: true,
  assistantName: 'Asistente Greenlanters',
  welcome: 'Hola 💚 Soy el asistente de Las Greenlanters Nails. ¿En qué puedo ayudarte?',
  whatsappNumber: '',
  fallbackMessage: 'Si prefieres, puedo llevarte directamente a WhatsApp para hablar con el salón.',
  aiEnabled: true
};

export const chatbotQuickActions = [
  { id: 'services', label: '💅 Servicios y precios' },
  { id: 'booking', label: '📅 Quiero reservar' },
  { id: 'hours', label: '🕐 Horarios' },
  { id: 'location', label: '📍 Dónde estáis' },
  { id: 'gift', label: '🎁 Tarjetas regalo' },
  { id: 'whatsapp', label: '💬 Hablar por WhatsApp' }
] as const;
