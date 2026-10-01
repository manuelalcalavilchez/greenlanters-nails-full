export interface BusinessProfile {
  id: string;
  name: string;
  sector: string;
  location: string;
  tagline: string;
  description: string;
  instagram: string;
  instagramUrl: string;
  logo: string;
  colors: { primary: string; accent: string; background: string; secondary: string };
  labels: {
    business: string;
    professional: string;
    service: string;
    appointment: string;
    staff: string;
    gallery: string;
  };
  features: {
    ar: boolean;
    customStudio: boolean;
    giftCards: boolean;
  };
}

export const businessProfile: BusinessProfile = {
  id: 'greenlanters-nails',
  name: 'Las Greenlanters Nails',
  sector: 'nail_studio',
  location: 'Almería',
  tagline: 'Tus manos hablan por ti. Haz que destaquen.',
  description: 'Manicurista · Técnica en uñas gel y poligel · Dibujos a mano · Decoración.',
  instagram: '@greenlanters.nails',
  instagramUrl: 'https://www.instagram.com/greenlanters.nails/',
  logo: '/logo.png',
  colors: { primary: '#082D05', accent: '#8CFF00', background: '#F7F8EF', secondary: '#176B00' },
  labels: { business: 'Salón', professional: 'Especialista', service: 'Servicio', appointment: 'Cita', staff: 'Cabina Staff', gallery: 'Galería' },
  features: { ar: true, customStudio: true, giftCards: true }
};

export const staffTokenStorageKey = `${businessProfile.id}_staff_token`;