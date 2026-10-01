export type AppointmentStatus = 'Pendiente' | 'Confirmada' | 'Completada' | 'Cancelada';

const transitions: Record<AppointmentStatus, AppointmentStatus[]> = {
  Pendiente: ['Confirmada', 'Cancelada'],
  Confirmada: ['Completada', 'Cancelada'],
  Completada: [],
  Cancelada: []
};

export const canTransitionAppointment = (from: AppointmentStatus, to: AppointmentStatus): boolean =>
  from === to || transitions[from].includes(to);

export const assertAppointmentTransition = (from: AppointmentStatus, to: AppointmentStatus): void => {
  if (!canTransitionAppointment(from, to)) {
    throw new Error('Transición de cita no permitida: ' + from + ' → ' + to);
  }
};

export const getAppointmentStatusLabel = (status: AppointmentStatus): string => status;
