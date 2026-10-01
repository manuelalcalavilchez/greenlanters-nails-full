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

export const buildAppointmentFromBookingRequest = (
  request: BookingRequestLike,
  now = new Date(),
  locator = generateAppointmentLocator()
): Appointment => {
  if (!request.preferredDate || !request.preferredTime) {
    throw new Error('Para confirmar una cita primero hay que tener fecha y hora solicitadas.');
  }

  return {
    id: `appt_${now.getTime()}`,
    locator,
    serviceIds: [],
    addonIds: [],
    specialistId: 'any',
    date: request.preferredDate,
    time: request.preferredTime,
    totalPrice: 0,
    totalDuration: 0,
    clientName: request.clientName,
    clientPhone: request.clientPhone,
    clientEmail: request.clientEmail,
    notes: `Solicitud: ${request.serviceType || ''}. ${request.notes || ''}`.trim(),
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
