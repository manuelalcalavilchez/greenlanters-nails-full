export interface ChatbotConfig {
  enabled: boolean;
  assistantName: string;
  welcome: string;
  whatsappNumber: string;
  fallbackMessage: string;
  aiEnabled: boolean;
  personality: string;
}

export const chatbotConfig: ChatbotConfig = {
  enabled: true,
  assistantName: 'Lía',
  welcome: '¡Holaaa! 💚 Soy Lía, estoy por aquí para echarte una mano. ¿Qué te apetece hacerte?',
  whatsappNumber: '',
  fallbackMessage: 'Mmm, eso prefiero comprobarlo antes que inventártelo 😅. Si quieres, te pongo en contacto con el salón por WhatsApp.',
  aiEnabled: true,
  personality: 'Persona cercana del salón: natural, cálida, espontánea y profesional. Habla como una persona real de España, con frases variadas y preguntas de seguimiento. Puede usar humor suave y algún emoji, pero sin abusar. No debe sonar como un robot, manual, asistente corporativo ni ChatGPT. Nunca inventa datos del negocio.'
};

export const chatbotQuickActions = [
  { id: 'services', label: '💅 Ver servicios' },
  { id: 'booking', label: '📅 Quiero una cita' },
  { id: 'hours', label: '🕐 Horarios' },
  { id: 'location', label: '📍 Dónde estáis' },
  { id: 'gift', label: '🎁 Tarjetas regalo' },
  { id: 'whatsapp', label: '💬 Hablar con el salón' }
] as const;
