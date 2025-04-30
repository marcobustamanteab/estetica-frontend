import React, { useEffect, useState, useRef } from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { useServices } from '../../hooks/useServices';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import '../../assets/styles/appointments/appointmentDetail.css';
import { CheckCircle } from 'lucide-react';

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
  // Usar el hook de servicios para obtener servicios y categorías
  const { services, categories, fetchServices, fetchCategories } = useServices();
  const [categoryName, setCategoryName] = useState<string>("");
  const [serviceDetails, setServiceDetails] = useState({
    price: 0,
    duration: 0
  });
  const [loading, setLoading] = useState(false);
  const hasAttemptedLoad = useRef(false);

  // Cargar servicios y categorías una sola vez cuando se muestra el componente
  useEffect(() => {
    const loadServicesAndCategories = async () => {
      if (hasAttemptedLoad.current) return;
      
      hasAttemptedLoad.current = true;
      
      // Solo cargar si no hay datos
      if (services.length === 0 || categories.length === 0) {
        setLoading(true);
        try {
          await Promise.all([
            fetchServices(),
            fetchCategories()
          ]);
        } catch (error) {
          console.error('Error loading services and categories:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadServicesAndCategories();
  }, [fetchServices, fetchCategories, services.length, categories.length]);

  // Encontrar el servicio y la categoría correspondiente
  useEffect(() => {
    if (services.length > 0 && categories.length > 0) {
      // Buscar el servicio de la cita
      const service = services.find(s => s.id === appointment.service);
      
      if (service) {
        // Guardar detalles del servicio
        setServiceDetails({
          price: service.price,
          duration: service.duration
        });
        
        // Buscar la categoría del servicio
        if (typeof service.category === 'number') {
          const category = categories.find(c => c.id === service.category);
          if (category) {
            setCategoryName(category.name);
          }
        }
      }
    }
  }, [appointment, services, categories]);
  
  // Formatear fecha para mostrar
  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Fecha inválida');
      }
      return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      console.error("Error al formatear fecha:", error, dateString);
      return dateString;
    }
  };
  
  // Verificar si la cita está completada
  const isCompleted = appointment.status === 'completed';
  
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
        {/* Categoría y Servicio */}
        <div className="detail-row">
          {categoryName && (
            <div className="detail-item category-item">
              <h4>Categoría</h4>
              <p className="category-name">{categoryName}</p>
            </div>
          )}
          <div className="detail-item">
            <h4>Servicio</h4>
            <p>{appointment.service_name}</p>
          </div>
        </div>
        
        {/* Atendido por y Cliente */}
        <div className="detail-row">
          <div className="detail-item">
            <h4>Atendido por</h4>
            <p>{appointment.employee_name}</p>
          </div>
          <div className="detail-item">
            <h4>Cliente</h4>
            <p>{appointment.client_name}</p>
          </div>
        </div>
        
        {/* Fecha y Horario */}
        <div className="detail-row">
          <div className="detail-item">
            <h4>Fecha</h4>
            <p>{formatDate(appointment.date)}</p>
          </div>
          <div className="detail-item">
            <h4>Horario</h4>
            <p>{appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}</p>
          </div>
        </div>
        
        {/* Estado solo */}
        <div className="detail-row">
          <div className="detail-item">
            <h4>Estado</h4>
            <p className={`status-badge ${getStatusClass(appointment.status)}`}>
              {getStatusText(appointment.status)}
            </p>
          </div>
        </div>
        
        {/* Información del servicio (precio y duración) */}
        {serviceDetails.price > 0 && (
          <div className="detail-row service-details">
            <div className="detail-item">
              <h4>Precio</h4>
              <p>${serviceDetails.price}</p>
            </div>
            <div className="detail-item">
              <h4>Duración</h4>
              <p>{serviceDetails.duration} minutos</p>
            </div>
          </div>
        )}
        
        {appointment.notes && (
          <div className="detail-notes">
            <h4>Notas</h4>
            <p>{appointment.notes}</p>
          </div>
        )}
        
        {/* Mostrar mensaje de carga si corresponde */}
        {loading && (
          <div className="loading-message" style={{textAlign: 'center', padding: '10px', color: '#666'}}>
            Cargando información completa...
          </div>
        )}
      </div>
      
      {!isCompleted ? (
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
      ) : (
        <div className="appointment-completed-message">
          <span className="success-icon">
            <CheckCircle size={28} />
          </span>
          <p>
            <strong>Esta cita ha sido completada.</strong>
            Las citas completadas no pueden ser editadas ni cambiar su estado.
          </p>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetail;