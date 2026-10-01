import { businessAddons, businessProfessionals, businessServices } from '../config/businessCatalog';

/** Compatibilidad con componentes existentes. El catálogo real vive en config/businessCatalog. */
export const SERVICES = businessServices;
export const ADDONS = businessAddons;
export const SPECIALISTS = businessProfessionals;

export const LOOKBOOK_ITEMS = [
  {
    id: 'lb1',
    title: 'Agenda Abierta: Cristales & Strass',
    category: 'Promoción 20€',
    image: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?q=80&w=900&auto=format&fit=crop',
    description: 'Manicura completa con limpieza de cutícula y toda la decoración con cristales incluida por solo 20€.',
    styleId: 'emerald_gold'
  },
  {
    id: 'lb2',
    title: 'Esmaltado Permanente Rojo Pasión',
    category: 'Promoción 10€',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=900&auto=format&fit=crop',
    description: 'Esmaltado permanente impecable con limpieza de cutícula y decoración por tan solo 10€.',
    styleId: 'russian_glazed'
  },
  {
    id: 'lb3',
    title: 'Emerald Signature & Strass',
    category: 'Nail Art de Autor',
    image: 'https://images.unsplash.com/photo-1632345031435-8727f6c97d34?q=80&w=900&auto=format&fit=crop',
    description: 'Diseño exclusivo Greenlanters con incrustaciones de pedrería y acabado vítreo.',
    styleId: 'cat_eye'
  }
];

export const NAIL_STYLES_CATALOG = [
  { id: 'emerald_gold', name: 'Strass & Cristales VIP', bgGradient: 'from-[#082D05] via-[#176B00] to-[#164E3B]', accent: '#8CFF00', badge: 'Promo 20€' },
  { id: 'russian_glazed', name: 'Esmaltado Permanente 10€', bgGradient: 'from-[#F7F8EF] via-[#e5dfd3] to-[#d4cfc2]', accent: '#082D05', badge: 'Promo 10€' },
  { id: 'cat_eye', name: 'Verde Esmeralda 9D', bgGradient: 'from-[#082D05] via-[#1b4332] to-[#2d6a4f]', accent: '#8CFF00', badge: 'Tendencia' },
  { id: 'burgundy_noir', name: 'Borgoña & Oro', bgGradient: 'from-[#2B0C15] via-[#4a1525] to-[#2B0C15]', accent: '#8CFF00', badge: 'Elegante' }
];
