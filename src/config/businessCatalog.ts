import type { AddonItem, ServiceItem, Specialist } from '../types';

/** Catálogo inicial del tenant. El motor consume este contrato sin conocer el vertical. */
export const businessServices: ServiceItem[] = [
  { id: 's1', name: 'Manicura Completa con Decoración', category: 'manicura', durationMinutes: 60, price: 20, description: 'Agenda Abierta: Tu manicura con limpieza de cutícula y toda la decoración incluida (cristales, incrustaciones y efectos).' },
  { id: 's2', name: 'Esmaltado Permanente', category: 'esmaltado', durationMinutes: 45, price: 10, description: 'Esmaltado permanente de alta duración con limpieza de cutícula y decoración incluida.' },
  { id: 's3', name: 'Uñas de Gel & Acrylgel', category: 'gel_acrigel', durationMinutes: 90, price: 35, description: 'Construcción y extensión con moldes duales o tips, máxima resistencia y diseño personalizado.' },
  { id: 's4', name: 'Pedicura Spa Completa', category: 'pedicura', durationMinutes: 60, price: 25, description: 'Tratamiento profundo de cutículas, exfoliación y esmaltado permanente con decoración.' },
];

export const businessAddons: AddonItem[] = [
  { id: 'a1', name: 'Efecto Glazed Cromo Perla', durationMinutes: 10, price: 0 },
  { id: 'a2', name: 'Efecto Cat Eye 9D Magnético', durationMinutes: 15, price: 0 },
  { id: 'a3', name: 'Pan de Oro 24k / Incrustaciones', durationMinutes: 15, price: 0 },
  { id: 'a4', name: 'Cristales Swarovski y Piedras', durationMinutes: 15, price: 0 },
];

export const businessProfessionals: Specialist[] = [
  { id: 'any', name: 'Cualquiera Disponible', role: 'Equipo Greenlanters', avatar: '👤' },
  { id: 'val', name: 'Valentina Rossi', role: 'Master Nail Artist & Rusa Expert', avatar: '👩🏻' },
  { id: 'sof', name: 'Sofía Laurent', role: 'Especialista en Gel & Estética Avanzada', avatar: '👩🏼' },
  { id: 'ele', name: 'Elena Vance', role: 'Directora Creativa & Nail Designer', avatar: '👩🏽' },
];

export const businessCatalog = {
  services: businessServices,
  addons: businessAddons,
  professionals: businessProfessionals,
};
