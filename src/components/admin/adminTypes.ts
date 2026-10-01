import React from 'react';
import { Appointment, CustomDesign, NailCatalogStyle } from '../../types';
import { businessProfile } from '../../config/businessProfile';
import { BusinessConfig, BusinessProfessional, BusinessService } from '../../domain/businessTypes';

export type { BusinessConfig, BusinessProfessional, BusinessService } from '../../domain/businessTypes';

export interface SalonConfig extends Omit<BusinessConfig, 'productOptions'> {
  // Campos específicos heredados del primer vertical; el motor puede sustituirlos
  // por opciones equivalentes del negocio sin cambiar su contrato base.
  nailShapes: string[];
  nailLengths: string[];
  nailStyles: string[];
  products: string[];
}

export interface AdminPanelProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  customDesigns: CustomDesign[];
  setCustomDesigns: React.Dispatch<React.SetStateAction<CustomDesign[]>>;
  catalogStyles?: NailCatalogStyle[];
  setCatalogStyles?: React.Dispatch<React.SetStateAction<NailCatalogStyle[]>>;
  onAddToCatalog?: (design: CustomDesign) => void;
}

export const DEFAULT_WORKING_HOURS = [
  { day: 'Lunes', open: '10:00', close: '20:00', enabled: true },
  { day: 'Martes', open: '10:00', close: '20:00', enabled: true },
  { day: 'Miércoles', open: '10:00', close: '20:00', enabled: true },
  { day: 'Jueves', open: '10:00', close: '20:00', enabled: true },
  { day: 'Viernes', open: '10:00', close: '20:00', enabled: true },
  { day: 'Sábado', open: '10:00', close: '14:00', enabled: true },
  { day: 'Domingo', open: '10:00', close: '14:00', enabled: false }
];

export const DEFAULT_CONFIG: SalonConfig = {
  name: businessProfile.name,
  description: businessProfile.description,
  phone: '',
  email: '',
  address: businessProfile.location,
  hours: '',
  whatsapp: '',
  logo: businessProfile.logo,
  coverPhoto: '',
  calendarPublic: true,
  workingHours: DEFAULT_WORKING_HOURS,
  blockedSlots: [],
  vacations: [],
  nailShapes: [],
  nailLengths: [],
  nailStyles: [],
  products: [],
  colors: {
    primary: businessProfile.colors.primary,
    accent: businessProfile.colors.accent,
    background: businessProfile.colors.background
  }
};
