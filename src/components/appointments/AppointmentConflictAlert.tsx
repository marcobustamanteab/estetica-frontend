/* eslint-disable @typescript-eslint/no-unused-vars */
import { Appointment } from '../../hooks/useAppointments';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './appointmentConflictAlert.css';

interface AppointmentConflictAlertProps {
  employee: { id: number; first_name: string; last_name: string };
  conflictingAppointment: Appointment;
  onClose: () => void;
  onReschedule?: () => void;
}

const AppointmentConflictAlert: React.FC<AppointmentConflictAlertProps> = ({
  employee,
  conflictingAppointment,
  onClose,
  onReschedule
}) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE d 'de' MMMM", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="conflict-alert-overlay">
      <div className="conflict-alert-container">
        <div className="conflict-alert-header">
          <h3>Conflicto de Horario</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <div className="conflict-alert-content">
          <div className="conflict-icon">⚠️</div>
          <p className="conflict-message">
            <strong>{employee.first_name} {employee.last_name}</strong> ya tiene una cita programada en este horario.
          </p>
          
          <div className="conflicting-details">
            <h4>Detalles de la cita existente:</h4>
            <div className="conflict-detail-item">
              <span className="conflict-detail-label">Fecha:</span>
              <span className="conflict-detail-value">{formatDate(conflictingAppointment.date)}</span>
            </div>
            <div className="conflict-detail-item">
              <span className="conflict-detail-label">Hora:</span>
              <span className="conflict-detail-value">{conflictingAppointment.start_time} - {conflictingAppointment.end_time}</span>
            </div>
            <div className="conflict-detail-item">
              <span className="conflict-detail-label">Cliente:</span>
              <span className="conflict-detail-value">{conflictingAppointment.client_name}</span>
            </div>
            <div className="conflict-detail-item">
              <span className="conflict-detail-label">Servicio:</span>
              <span className="conflict-detail-value">{conflictingAppointment.service_name}</span>
            </div>
          </div>
          
          <p className="conflict-suggestion">
            Por favor, selecciona otro horario o empleado para esta cita.
          </p>
          
          <div className="conflict-actions">
            <button className="secondary-button" onClick={onClose}>
              Entendido
            </button>
            {onReschedule && (
              <button className="primary-button" onClick={onReschedule}>
                Buscar otro horario
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConflictAlert;