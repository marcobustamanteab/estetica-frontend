import { useState, useEffect, useRef } from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { Client } from '../../hooks/useClients';
import { Service, ServiceCategory } from '../../hooks/useServices';
import { User } from '../../hooks/useUsers';
import { AppointmentFormValues, getInitialAppointmentFormValues, validateAppointmentForm } from '../../forms/appointmentsFormValues';
import '../common/modal.css';
import '../../assets/styles/appointments/appointmentForm.css';
import { checkEmployeeAvailability, isOverlapping } from '../../services/availabilityService';
import { format } from 'date-fns';

interface AppointmentFormModalProps {
  appointment: Appointment | null;
  clients: Client[];
  services: Service[];
  employees: User[];
  allAppointments: Appointment[];
  onClose: () => void;
  onSave: (appointmentData: AppointmentFormValues) => void;
  onCheckAvailability: (date: string, startTime: string, serviceId: number) => Promise<void>;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  appointment,
  clients,
  services,
  employees,
  allAppointments,
  onClose,
  onSave,
  onCheckAvailability
}) => {
  const [formData, setFormData] = useState<AppointmentFormValues>(getInitialAppointmentFormValues(appointment));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [conflictingAppointment, setConflictingAppointment] = useState<Appointment | null>(null);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  
  // Referencias para los campos de input que necesitamos manipular
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  // Obtener fecha y hora actual para las restricciones
  const today = format(new Date(), 'yyyy-MM-dd');
  const now = new Date();
  const currentHourStr = format(now, 'HH:mm');
  const minTime = format(now, 'HH:mm');

  // Solo mostrar clientes activos
  const activeClients = clients.filter(client => client.is_active);
  const activeUsers = employees.filter(user => user.is_active);
  const activeServices = services.filter(service => service.is_active);

  // Extraer las categorías únicas de los servicios
  useEffect(() => {
    if (services.length > 0) {
      // Crear un mapa para evitar categorías duplicadas
      const categoriesMap = new Map<number, ServiceCategory>();
      
      services.forEach(service => {
        if (service.category && !categoriesMap.has(service.category)) {
          categoriesMap.set(service.category, {
            id: service.category,
            name: service.category_name || 'Sin nombre',
            description: '',
            is_active: true
          });
        }
      });
      
      // Convertir el mapa a array y ordenar por nombre
      const categoriesArray = Array.from(categoriesMap.values()).sort((a, b) => 
        a.name.localeCompare(b.name)
      );
      
      setCategories(categoriesArray);
    }
  }, [services]);

  // Filtrar servicios cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategoryId) {
      const servicesInCategory = activeServices.filter(
        service => service.category === selectedCategoryId
      );
      setFilteredServices(servicesInCategory);
    } else {
      setFilteredServices(activeServices);
    }
  }, [selectedCategoryId, activeServices]);

  useEffect(() => {
    // Si estamos editando una cita pasada, usamos esa fecha, de lo contrario usamos el valor por defecto
    const initialData = getInitialAppointmentFormValues(appointment);
    
    // Si es una nueva cita, establecer la fecha como hoy por defecto
    if (!appointment) {
      initialData.date = today;
    }
    
    setFormData(initialData);

    // Si estamos editando, seleccionar el servicio y la categoría actuales
    if (appointment) {
      const service = services.find(s => s.id === appointment.service) || null;
      setSelectedService(service);
      
      if (service && service.category) {
        setSelectedCategoryId(service.category);
      }
    }
  }, [appointment, services, today]);

  // Cuando cambia el servicio o la hora de inicio, actualizar la hora de fin basado en la duración
  useEffect(() => {
    if (selectedService && formData.start_time) {
      try {
        // Convertir la hora de inicio a un objeto Date para poder sumar minutos
        const [hours, minutes] = formData.start_time.split(':').map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        // Sumar la duración del servicio
        const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
        const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

        // Actualizar el formulario con la nueva hora de fin
        setFormData(prev => ({
          ...prev,
          end_time: endTime
        }));
        
        // Actualizar directamente el input si existe
        if (endTimeInputRef.current) {
          endTimeInputRef.current.value = endTime;
        }
      } catch (error) {
        console.error("Error calculando la hora de fin:", error);
      }
    }
  }, [selectedService, formData.start_time]);

  // Verificar disponibilidad cada vez que cambia empleado, fecha u hora
  useEffect(() => {
    // Solo verificar si tenemos todos los datos necesarios
    if (formData.employee && formData.date && formData.start_time && formData.end_time) {
      // Si estamos editando, necesitamos excluir la cita actual de la verificación
      const appointmentsToCheck = appointment 
        ? allAppointments.filter(a => a.id !== appointment.id)
        : allAppointments;
      
      // Verificar si hay conflicto según la función importada del servicio
      const { isAvailable, conflictingAppointment } = checkEmployeeAvailability(
        formData.employee,
        formData.date,
        formData.start_time,
        formData.end_time,
        appointmentsToCheck
      );
      
      // Mostrar error si hay conflicto
      if (!isAvailable && conflictingAppointment) {
        const employeeName = employees.find(e => e.id === formData.employee)?.first_name || 'El empleado';
        const clientName = conflictingAppointment.client_name;
        const startTime = conflictingAppointment.start_time;
        const endTime = conflictingAppointment.end_time;
        
        setAvailabilityError(
          `${employeeName} ya tiene una cita con ${clientName} de ${startTime} a ${endTime} en esta fecha.`
        );
        setConflictingAppointment(conflictingAppointment);
      } else {
        setAvailabilityError(null);
        setConflictingAppointment(null);
      }
      
      // Verificar citas canceladas (información, no bloqueo)
      // Buscar citas canceladas para este empleado en este horario
      const cancelledAppts = allAppointments.filter(
        a => a.employee === formData.employee && 
           a.date === formData.date && 
           a.status === 'cancelled' &&
           isOverlapping(formData.start_time, formData.end_time, a.start_time, a.end_time)
      );
      
      setCancelledAppointments(cancelledAppts);
    } else {
      // Limpiar errores si no hay datos suficientes para verificar
      setAvailabilityError(null);
      setConflictingAppointment(null);
      setCancelledAppointments([]);
    }
  }, [formData.employee, formData.date, formData.start_time, formData.end_time, allAppointments, appointment, employees]);

  // Validar la fecha y hora seleccionadas
  useEffect(() => {
    // Si la fecha es anterior a hoy, mostrar error
    if (formData.date && formData.date < today && !appointment) {
      setErrors(prev => ({
        ...prev,
        date: 'No se pueden agendar citas en fechas pasadas'
      }));
    } 
    // Si es hoy y la hora seleccionada es anterior a la hora actual
    else if (formData.date === today && formData.start_time && formData.start_time < minTime && !appointment) {
      setErrors(prev => ({
        ...prev,
        start_time: 'No se pueden agendar citas en horarios pasados'
      }));
    } else {
      // Limpiar errores si todo está bien
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.date;
        delete newErrors.start_time;
        return newErrors;
      });
    }
  }, [formData.date, formData.start_time, today, minTime, appointment]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Manejar cambio de categoría
    if (name === 'category') {
      const categoryId = value ? Number(value) : null;
      setSelectedCategoryId(categoryId);
      
      // Al cambiar la categoría, resetear el servicio seleccionado
      setFormData(prev => ({
        ...prev,
        service: 0
      }));
      setSelectedService(null);
      return;
    }

    // Manejar servicios para calcular automáticamente la hora de fin
    if (name === 'service') {
      const serviceId = Number(value);
      const service = services.find(s => s.id === serviceId) || null;
      setSelectedService(service);
      
      // Si ya hay una hora de inicio, calcular la hora de fin
      if (service && formData.start_time) {
        try {
          const [hours, minutes] = formData.start_time.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(startDate.getTime() + service.duration * 60000);
          const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
          
          setFormData(prev => ({
            ...prev,
            end_time: endTime,
            service: serviceId
          }));
          
          if (endTimeInputRef.current) {
            endTimeInputRef.current.value = endTime;
          }
        } catch (error) {
          console.error("Error calculando la hora de fin:", error);
          setFormData(prev => ({
            ...prev,
            service: serviceId
          }));
        }
      } else {
        setFormData(prev => ({
          ...prev,
          service: serviceId
        }));
      }
      return;
    }

    // Cuando cambia la fecha o la hora, verificar disponibilidad
    if ((name === 'date' || name === 'start_time' || name === 'employee') && formData.service && onCheckAvailability) {
      const date = name === 'date' ? value : formData.date;
      const startTime = name === 'start_time' ? value : formData.start_time;

      // Solo verificar si ambos tienen valor
      if (date && startTime) {
        onCheckAvailability(date, startTime, formData.service);
      }
    }

    // Validar fecha pasada
    if (name === 'date' && value < today && !appointment) {
      setErrors(prev => ({
        ...prev,
        date: 'No se pueden agendar citas en fechas pasadas'
      }));
    } else if (name === 'date') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }

    // Validar hora pasada si es hoy
    if (name === 'start_time' && formData.date === today && value < minTime && !appointment) {
      setErrors(prev => ({
        ...prev,
        start_time: 'No se pueden agendar citas en horarios pasados'
      }));
    } else if (name === 'start_time') {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.start_time;
        return newErrors;
      });
      
      // Si tenemos un servicio seleccionado, actualizar la hora de fin
      if (selectedService) {
        try {
          const [hours, minutes] = value.split(':').map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);
          
          const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
          const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
          
          setFormData(prev => ({
            ...prev,
            start_time: value,
            end_time: endTime
          }));
          
          if (endTimeInputRef.current) {
            endTimeInputRef.current.value = endTime;
          }
        } catch (error) {
          console.error("Error calculando la hora de fin:", error);
          setFormData(prev => ({
            ...prev,
            start_time: value
          }));
        }
        return;
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === 'service' || name === 'client' || name === 'employee' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Si hay un conflicto de disponibilidad, mostrar error
    if (availabilityError) {
      return;
    }

    // Validar fecha y hora
    if (formData.date < today && !appointment) {
      setErrors(prev => ({
        ...prev,
        date: 'No se pueden agendar citas en fechas pasadas'
      }));
      return;
    }

    if (formData.date === today && formData.start_time < minTime && !appointment) {
      setErrors(prev => ({
        ...prev,
        start_time: 'No se pueden agendar citas en horarios pasados'
      }));
      return;
    }

    const formErrors = validateAppointmentForm(formData);
    setErrors(prev => ({ ...prev, ...formErrors }));

    if (Object.keys(errors).length > 0) return;

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container appointment-form-modal">
        <div className="modal-header">
          <h3>{appointment ? 'Editar Cita' : 'Nueva Cita'}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
  
        <form onSubmit={handleSubmit} className="form">
          {availabilityError && (
            <div className="availability-alert">
              <div className="availability-error">
                <i className="availability-icon">⚠️</i>
                <p>{availabilityError}</p>
              </div>
              {conflictingAppointment && (
                <div className="conflicting-appointment">
                  <p><strong>Detalles de la cita en conflicto:</strong></p>
                  <p>Cliente: {conflictingAppointment.client_name}</p>
                  <p>Servicio: {conflictingAppointment.service_name}</p>
                  <p>Hora: {conflictingAppointment.start_time} - {conflictingAppointment.end_time}</p>
                </div>
              )}
            </div>
          )}
  
          {/* Primera fila: Categoría y Servicio */}
          <div className="form-row">
            {/* Selector de categoría */}
            <div className="form-group">
              <label htmlFor="category">Categoría de Servicio</label>
              <select
                id="category"
                name="category"
                value={selectedCategoryId || ''}
                onChange={handleChange}
                className="form-input"
              >
                <option value="">Seleccione una categoría...</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
  
            {/* Selector de servicio filtrado por categoría */}
            <div className="form-group">
              <label htmlFor="service">Servicio</label>
              <select
                id="service"
                name="service"
                value={formData.service}
                onChange={handleChange}
                className={errors.service ? 'form-input error' : 'form-input'}
                disabled={!selectedCategoryId}
              >
                <option value="0">Seleccione un servicio...</option>
                {filteredServices.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} (${service.price} - {service.duration} min)
                  </option>
                ))}
              </select>
              {errors.service && <span className="error-message">{errors.service}</span>}
            </div>
          </div>
  
          {/* Segunda fila: Empleado y Cliente */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="employee">Empleado</label>
              <select
                id="employee"
                name="employee"
                value={formData.employee}
                onChange={handleChange}
                className={errors.employee ? 'form-input error' : 'form-input'}
              >
                <option value="0">Seleccione un empleado...</option>
                {activeUsers.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
              {errors.employee && <span className="error-message">{errors.employee}</span>}
            </div>
  
            <div className="form-group">
              <label htmlFor="client">Cliente</label>
              <select
                id="client"
                name="client"
                value={formData.client}
                onChange={handleChange}
                className={errors.client ? 'form-input error' : 'form-input'}
              >
                <option value="0">Seleccione un cliente...</option>
                {activeClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </option>
                ))}
              </select>
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>
          </div>
  
          {/* Información del servicio seleccionado */}
          {selectedService && (
            <div className="service-info">
              <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
              <p><strong>Precio:</strong> ${selectedService.price}</p>
            </div>
          )}
  
          {/* Tercera fila: Fecha y Horas (se mantiene como estaba) */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Fecha</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? 'form-input error' : 'form-input'}
                min={today} // Restringir a fechas futuras
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
  
            <div className="form-group">
              <label htmlFor="start_time">Hora de inicio</label>
              <input
                type="time"
                id="start_time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className={errors.start_time ? 'form-input error' : 'form-input'}
                ref={startTimeInputRef}
                min={formData.date === today ? minTime : "06:00"}
                max="23:59"
                step="60" // Permitir cualquier minuto
              />
              {errors.start_time && <span className="error-message">{errors.start_time}</span>}
              {formData.date === today && (
                <span className="help-text">Mínimo: {currentHourStr} (hora actual)</span>
              )}
            </div>
  
            <div className="form-group">
              <label htmlFor="end_time">Hora de fin</label>
              <input
                type="time"
                id="end_time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className={errors.end_time ? 'form-input error' : 'form-input'}
                readOnly={!!selectedService} // Hacer solo lectura si hay servicio seleccionado
                ref={endTimeInputRef}
                min={formData.start_time}
                max="23:59"
                step="60" // Permitir cualquier minuto
              />
              {errors.end_time && <span className="error-message">{errors.end_time}</span>}
              {selectedService && (
                <span className="help-text">Calculado automáticamente en base a la duración del servicio</span>
              )}
            </div>
          </div>
  
          {cancelledAppointments.length > 0 && (
            <div className="cancelled-appointments-info">
              <h4>Nota: Citas canceladas en este horario</h4>
              <p>Existen {cancelledAppointments.length} citas canceladas en este horario:</p>
              <ul>
                {cancelledAppointments.map((appointment, index) => (
                  <li key={index}>
                    <strong>{appointment.client_name}</strong> - {appointment.service_name}
                    <span className="cancelled-time">
                      ({appointment.start_time} - {appointment.end_time})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
  
          {!appointment && (
            <div className="form-group">
              <label htmlFor="status">Estado</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={errors.status ? 'form-input error' : 'form-input'}
              >
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
              </select>
            </div>
          )}
  
          <div className="form-group">
            <label htmlFor="notes">Notas adicionales</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="form-input"
              rows={3}
            />
          </div>
  
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className={availabilityError || Object.keys(errors).length > 0 ? "save-button disabled" : "save-button"}
              disabled={!!availabilityError || Object.keys(errors).length > 0}
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentFormModal;