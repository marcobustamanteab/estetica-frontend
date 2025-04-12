/* eslint-disable @typescript-eslint/no-explicit-any */
// src/services/availabilityService.ts - Corrección para manejar citas canceladas

import { Appointment } from '../hooks/useAppointments';
import { User } from '../hooks/useUsers';

// Interfaz para representar un bloque de tiempo
export interface TimeBlock {
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  conflictingAppointment?: Appointment;
}

// Interfaz para representar disponibilidad de un empleado
export interface EmployeeAvailability {
  employeeId: number;
  employeeName: string;
  timeBlocks: TimeBlock[];
}

// Opciones de configuración para el servicio
interface AvailabilityOptions {
  workdayStart: string;     // HH:MM formato 24h (ej: "08:00")
  workdayEnd: string;       // HH:MM formato 24h (ej: "20:00")
  appointmentDuration: number; // Duración en minutos
  timeSlotInterval: number; // Intervalo en minutos entre cada slot
}

const defaultOptions: AvailabilityOptions = {
  workdayStart: "08:00",
  workdayEnd: "20:00",
  appointmentDuration: 30,
  timeSlotInterval: 15
};

// Función para comparar horas en formato HH:MM
const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Función para convertir minutos a formato HH:MM
const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

// Función para verificar si dos intervalos de tiempo se solapan
export const isOverlapping = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  const start1Min = timeToMinutes(start1);
  const end1Min = timeToMinutes(end1);
  const start2Min = timeToMinutes(start2);
  const end2Min = timeToMinutes(end2);
  
  return start1Min < end2Min && end1Min > start2Min;
};

/**
 * Genera los bloques de tiempo disponibles para un empleado en una fecha específica
 */
export const generateEmployeeAvailability = (
  employeeId: number,
  employeeName: string,
  date: string,
  appointments: Appointment[],
  options: Partial<AvailabilityOptions> = {}
): EmployeeAvailability => {
  // Combinar opciones proporcionadas con valores predeterminados
  const config = { ...defaultOptions, ...options };
  
  // Filtrar citas para el empleado y la fecha específicos
  // Importante: solo considerar citas pendientes o confirmadas, no canceladas
  const employeeAppointments = appointments.filter(
    appointment => 
      appointment.employee === employeeId && 
      appointment.date === date &&
      // Solo considerar citas pendientes o confirmadas
      (appointment.status === 'pending' || appointment.status === 'confirmed')
  );
  // Generar bloques de tiempo
  const timeBlocks: TimeBlock[] = [];
  const startMinutes = timeToMinutes(config.workdayStart);
  const endMinutes = timeToMinutes(config.workdayEnd);
  
  // Crear bloques en incrementos basados en el intervalo
  for (let time = startMinutes; time < endMinutes; time += config.timeSlotInterval) {
    const slotStart = minutesToTime(time);
    const slotEnd = minutesToTime(time + config.appointmentDuration);
    
    // No crear bloques que terminen después del fin de la jornada
    if (timeToMinutes(slotEnd) > endMinutes) {
      break;
    }
    
    // Verificar si el bloque se solapa con alguna cita existente
    let isAvailable = true;
    let conflictingAppointment: Appointment | undefined;
    
    for (const appointment of employeeAppointments) {
      if (isOverlapping(slotStart, slotEnd, appointment.start_time, appointment.end_time)) {
        isAvailable = false;
        conflictingAppointment = appointment;
        break;
      }
    }
    
    timeBlocks.push({
      startTime: slotStart,
      endTime: slotEnd,
      isAvailable,
      conflictingAppointment
    });
  }
  
  return {
    employeeId,
    employeeName,
    timeBlocks
  };
};

/**
 * Verifica la disponibilidad de un empleado para un horario específico
 * 
 * @param employeeId ID del empleado
 * @param date Fecha en formato YYYY-MM-DD
 * @param startTime Hora de inicio en formato HH:MM
 * @param endTime Hora de fin en formato HH:MM
 * @param appointments Lista de citas existentes
 * @returns Objeto con información sobre disponibilidad y conflicto si existe
 */
export const checkEmployeeAvailability = (
  employeeId: number,
  date: string,
  startTime: string,
  endTime: string,
  appointments: Appointment[]
): {isAvailable: boolean; conflictingAppointment?: Appointment} => {
  // Filtrar citas para el empleado y la fecha específicos
  // CORRECCIÓN: Excluir explícitamente las citas canceladas
  const employeeAppointments = appointments.filter(
    appointment => 
      appointment.employee === employeeId && 
      appointment.date === date &&
      // Solo considerar citas pendientes o confirmadas
      (appointment.status === 'pending' || appointment.status === 'confirmed')
  );
  
  // Verificar solapamientos
  for (const appointment of employeeAppointments) {
    if (isOverlapping(startTime, endTime, appointment.start_time, appointment.end_time)) {
      return {
        isAvailable: false,
        conflictingAppointment: appointment
      };
    }
  }
  
  return {
    isAvailable: true
  };
};

/**
 * Obtiene empleados disponibles para una fecha y hora específicas
 * Función de compatibilidad con la API existente
 */
export const getAvailableEmployees = async (
  date: string,
  startTime: string,
  serviceId: number,
  employees: User[],
  appointments: Appointment[],
  services: any[]
): Promise<User[]> => {
  // Obtener el servicio
  const service = services.find(s => s.id === serviceId);
  if (!service) {
    return employees; // Si no hay servicio, devolver todos los empleados
  }
  
  // Calcular hora de fin basada en la duración del servicio
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  
  const endDate = new Date(startDate.getTime() + service.duration * 60000);
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  
  // Filtrar empleados disponibles
  const availableEmployees = employees.filter(employee => {
    const { isAvailable } = checkEmployeeAvailability(
      employee.id,
      date,
      startTime,
      endTime,
      appointments
    );
    return isAvailable;
  });
  
  return availableEmployees;
};