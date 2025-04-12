import React from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../assets/styles/appointments/appointmentDetail.css';

interface AppointmentDetailProps {
  appointment: Appointment;
  onClose: () => void;
  onChangeStatus: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AppointmentDetail: React.FC<AppointmentDetailProps> = ({ 
  appointment, 
  onClose, 
  onChangeStatus,
  onEdit,
  onDelete
}) => {
  // Formatear fecha para mostrar
  const formatDate = (dateString: string): string => {
    try {
      // Usar parseISO que maneja correctamente fechas en formato ISO (YYYY-MM-DD)
      const date = parseISO(dateString);
      
      // Verificar que la fecha sea válida
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString);
      return dateString;
    }
  };
  
  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return '';
    }
  };
  
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'cancelled': return 'Cancelada';
      case 'completed': return 'Completada';
      default: return status;
    }
  };
  
  return (
    <div className="appointment-detail">
      <div className="appointment-header">
        <h3>Detalles de la Cita</h3>
        <button className="close-button" onClick={onClose}>&times;</button>
      </div>
      
      <div className="appointment-content">
        <div className="detail-row">
          <div className="detail-item">
            <h4>Cliente</h4>
            <p>{appointment.client_name}</p>
          </div>
          <div className="detail-item">
            <h4>Servicio</h4>
            <p>{appointment.service_name}</p>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-item">
            <h4>Fecha</h4>
            <p>{formatDate(appointment.date)}</p>
          </div>
          <div className="detail-item">
            <h4>Horario</h4>
            <p>{appointment.start_time} - {appointment.end_time}</p>
          </div>
        </div>
        
        <div className="detail-row">
          <div className="detail-item">
            <h4>Empleado</h4>
            <p>{appointment.employee_name}</p>
          </div>
          <div className="detail-item">
            <h4>Estado</h4>
            <p className={`status-badge ${getStatusClass(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </p>
          </div>
        </div>
        
        {appointment.notes && (
          <div className="detail-notes">
            <h4>Notas</h4>
            <p>{appointment.notes}</p>
          </div>
        )}
      </div>
      
      <div className="appointment-actions">
        <h4>Cambiar Estado</h4>
        <div className="status-actions">
          {appointment.status !== 'confirmed' && (
            <button 
              className="status-button confirmed"
              onClick={() => onChangeStatus('confirmed')}
            >
              Confirmar
            </button>
          )}
          
          {appointment.status !== 'cancelled' && (
            <button 
              className="status-button cancelled"
              onClick={() => onChangeStatus('cancelled')}
            >
              Cancelar
            </button>
          )}
          
          {appointment.status !== 'completed' && (
            <button 
              className="status-button completed"
              onClick={() => onChangeStatus('completed')}
            >
              Completar
            </button>
          )}
        </div>
        
        <div className="management-actions">
          <button className="edit-button" onClick={onEdit}>Editar</button>
          <button className="delete-button" onClick={onDelete}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetail;