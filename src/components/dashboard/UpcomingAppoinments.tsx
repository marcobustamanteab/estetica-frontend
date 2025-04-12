/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../assets/styles/dashboard/upcomingAppointments.css';

interface UpcomingAppointmentsProps {
  appointments: Appointment[];
  onAppointmentClick: (appointment: Appointment) => void;
}

const UpcomingAppointments: React.FC<UpcomingAppointmentsProps> = ({ 
  appointments, 
  onAppointmentClick 
}) => {
  // Ordenar citas por fecha y hora
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.start_time}`);
    const dateB = new Date(`${b.date}T${b.start_time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Tomar solo las próximas 6 citas (antes eran 5)
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
    } catch (_) {
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
          {/* Iterar por fechas agrupadas */}
          {Object.entries(groupedAppointments).map(([date, dateAppointments]) => (
            <div key={date} className="date-group">
              <div className="date-header">
                <span className="date-label">{formatDateLabel(date)}</span>
                <span className="date-count">{dateAppointments.length} {dateAppointments.length === 1 ? 'cita' : 'citas'}</span>
              </div>
              
              {dateAppointments.map(appointment => (
                <div 
                  key={appointment.id} 
                  className="appointment-card"
                  onClick={() => onAppointmentClick(appointment)}
                >
                  <div className="appointment-time-block">
                    <span className="appointment-time">{appointment.start_time.substring(0, 5)}</span>
                  </div>
                  <div className="appointment-info">
                    <div className="appointment-client">{appointment.client_name}</div>
                    <div className="appointment-service">{appointment.service_name}</div>
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