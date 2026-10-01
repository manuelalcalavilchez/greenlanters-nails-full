export interface BusinessService {
  id: string;
  name: string;
  category: string;
  durationMinutes: number;
  price: number;
  description: string;
  active?: boolean;
}

export interface BusinessProfessional {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  photo?: string;
  description?: string;
  active?: boolean;
}

export interface BusinessConfig {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  hours: string;
  whatsapp: string;
  logo: string;
  coverPhoto: string;
  calendarPublic: boolean;
  workingHours: Array<{ day: string; open: string; close: string; enabled: boolean }>;
  blockedSlots: string[];
  vacations: string[];
  productOptions: string[];
  colors: { primary: string; accent: string; background: string };
}
