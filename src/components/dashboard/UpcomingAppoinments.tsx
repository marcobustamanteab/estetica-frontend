/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { format, parseISO, isToday, isTomorrow, isAfter, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import '../../assets/styles/dashboard/upcomingAppointments.css';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ 
  appointments, 
  onAppointmentClick 
}) => {
  // Filtrar solo citas futuras o de hoy
  const futureAppointments = appointments.filter(appointment => {
    try {
      const appointmentDate = parseISO(appointment.date);
      const today = startOfDay(new Date());
      
      // Incluir citas de hoy o futuras, excluyendo las canceladas
      return (isAfter(appointmentDate, today) || isToday(appointmentDate)) && 
             appointment.status !== 'cancelled' &&
             appointment.status !== 'completed';
    } catch (error) {
      console.error("Error procesando fecha de cita:", appointment.date);
      return false;
    }
  });

  // Ordenar citas por fecha y hora
  const sortedAppointments = [...futureAppointments].sort((a, b) => {
    // Comparar primero por fecha
    const dateA = parseISO(a.date);
    const dateB = parseISO(b.date);
    
    if (dateA.getTime() !== dateB.getTime()) {
      return dateA.getTime() - dateB.getTime();
    }
    
    // Si las fechas son iguales, comparar por hora
    return a.start_time.localeCompare(b.start_time);
  });

  // Tomar solo las próximas 6 citas
  const upcomingAppointments = sortedAppointments.slice(0, 6);

  // Formatear fecha para mostrar
  const formatDateLabel = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (isToday(date)) {
        return 'Hoy';
      } else if (isTomorrow(date)) {
        return 'Mañana';
      } else {
        return format(date, "EEE d MMM", { locale: es });
      }
    } catch (error) {
      console.error("Error formateando fecha:", dateString, error);
      return dateString;
    }
  };

  // Obtener clase CSS según estado
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };
  
  // Obtener texto de estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };

  // Agrupar citas por fecha
  const groupedAppointments = upcomingAppointments.reduce((groups, appointment) => {
    const date = appointment.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(appointment);
    return groups;
  }, {} as Record<string, Appointment[]>);

  // Ordenar las fechas para mostrar primero "Hoy", luego "Mañana" y después el resto
  const orderedDates = Object.keys(groupedAppointments).sort((a, b) => {
    const dateA = parseISO(a);
    const dateB = parseISO(b);
    
    // Lógica especial para dar prioridad a "Hoy" y "Mañana"
    const isTodayA = isToday(dateA);
    const isTodayB = isToday(dateB);
    const isTomorrowA = isTomorrow(dateA);
    const isTomorrowB = isTomorrow(dateB);
    
    if (isTodayA && !isTodayB) return -1; // Hoy primero
    if (isTodayB && !isTodayA) return 1;
    if (isTomorrowA && !isTomorrowB && !isTodayB) return -1; // Mañana segundo
    if (isTomorrowB && !isTomorrowA && !isTodayA) return 1;
    
    // Para el resto, orden cronológico normal
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="upcoming-appointments-container">
      <h3 className="widget-title">Próximas Citas</h3>
      
      {upcomingAppointments.length === 0 ? (
        <div className="no-appointments">
          <div className="empty-state">
            <i className="empty-icon">📅</i>
            <p>No hay citas próximas</p>
          </div>
        </div>
      ) : (
        <div className="appointments-list">
          {/* Iterar por fechas ordenadas */}
          {orderedDates.map(date => (
            <div key={date} className="date-group">
              <div className="date-header">
                <span className="date-label">{formatDateLabel(date)}</span>
                <span className="date-count">
                  {groupedAppointments[date].length} {groupedAppointments[date].length === 1 ? 'cita' : 'citas'}
                </span>
              </div>
              
              {groupedAppointments[date].map(appointment => (
                <div 
                  key={appointment.id} 
                  className="appointment-card"
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="appointment-time-block">
                    <Clock size={14} className="clock-icon" />
                    <span className="appointment-time">{appointment.start_time.substring(0, 5)}</span>
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-client">{appointment.client_name}</div>
                    <div className="appointment-service">{appointment.service_name}</div>
                    <div className="appointment-employee">Con: {appointment.employee_name}</div>
                  </div>
                  <div className="appointment-meta">
                    <span className={`appointment-status-badge ${getStatusClass(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ))}
          
          <div className="view-all-link">
            <a href="/agenda">
              Ver todas las citas
              <span className="arrow-icon">→</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpcomingAppointments;