import { Appointment } from '../../types';
import { assertAppointmentTransition } from './appointmentState';

export interface BookingRequestLike {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceType?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}

export const generateAppointmentLocator = (prefix = 'LGN'): string =>
  `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;

interface BookingService {
  id: string;
  name: string;
  category?: string;
  duration?: number | null;
  durationMinutes?: number | null;
  price?: number | null;
}

const normalizeBookingText = (value: string): string =>
  value.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const buildAppointmentFromBookingRequest = (
  request: BookingRequestLike,
  services: BookingService[] = [],
  now = new Date(),
  locator = generateAppointmentLocator()
): Appointment => {
  if (!request.preferredDate || !request.preferredTime) {
    throw new Error('Para confirmar una cita primero hay que tener fecha y hora solicitadas.');
  }

  const requestedService = normalizeBookingText(request.serviceType || '');
  const matchedService = services.find((service) => {
    const name = normalizeBookingText(service.name);
    const category = normalizeBookingText(service.category || '');
    return Boolean(requestedService) && (name === requestedService || name.includes(requestedService) || requestedService.includes(name) || category === requestedService);
  });

  const duration = Number(matchedService?.durationMinutes ?? matchedService?.duration ?? 0);
  const price = Number(matchedService?.price ?? 0);

  return {
    id: `appt_${now.getTime()}`,
    locator,
    serviceIds: matchedService ? [matchedService.id] : [],
    addonIds: [],
    specialistId: 'any',
    date: request.preferredDate,
    time: request.preferredTime,
    totalPrice: price,
    totalDuration: duration,
    clientName: request.clientName,
    clientPhone: request.clientPhone,
    clientEmail: request.clientEmail,
    notes: `Solicitud: ${request.serviceType || ''}.${matchedService ? '' : ' Servicio pendiente de asociar.'} ${request.notes || ''}`.trim(),
    status: 'Confirmada',
    createdAt: now.toISOString()
  };
};

export const validateAppointmentStatusChange = (
  current: Appointment['status'],
  next: Appointment['status']
): void => {
  assertAppointmentTransition(current, next);
};
