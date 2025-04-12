import { Appointment } from '../hooks/useAppointments';
import { format } from 'date-fns';

export interface AppointmentFormValues {
  client: number;
  service: number;
  employee: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
}

export const getInitialAppointmentFormValues = (appointment: Appointment | null): AppointmentFormValues => {
  if (appointment) {
    return {
      client: appointment.client,
      service: appointment.service,
      employee: appointment.employee,
      date: appointment.date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      notes: appointment.notes || ''
    };
  }
  
  // Valores por defecto
  const today = new Date();
  
  return {
    client: 0,
    service: 0,
    employee: 0,
    date: format(today, 'yyyy-MM-dd'),
    start_time: '09:00',
    end_time: '10:00',
    status: 'pending',
    notes: ''
  };
};

export const validateAppointmentForm = (values: AppointmentFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.client || values.client === 0) {
    errors.client = 'Debe seleccionar un cliente';
  }
  
  if (!values.service || values.service === 0) {
    errors.service = 'Debe seleccionar un servicio';
  }
  
  if (!values.employee || values.employee === 0) {
    errors.employee = 'Debe seleccionar un empleado';
  }
  
  if (!values.date) {
    errors.date = 'La fecha es obligatoria';
  } else {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    if (values.date < today) {
      errors.date = 'La fecha no puede ser anterior a hoy';
    }
  }
  
  if (!values.start_time) {
    errors.start_time = 'La hora de inicio es obligatoria';
  }
  
  if (!values.end_time) {
    errors.end_time = 'La hora de fin es obligatoria';
  } else if (values.start_time && values.end_time && values.start_time >= values.end_time) {
    errors.end_time = 'La hora de fin debe ser posterior a la hora de inicio';
  }
  
  return errors;
};