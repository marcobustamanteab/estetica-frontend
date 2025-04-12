// src/components/appointments/AppointmentFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Appointment } from '../../hooks/useAppointments';
import { Client } from '../../hooks/useClients';
import { Service } from '../../hooks/useServices';
import { User } from '../../hooks/useUsers';
import { AppointmentFormValues, getInitialAppointmentFormValues, validateAppointmentForm } from '../../forms/appointmentsFormValues';
import '../common/modal.css';
import '../../assets/styles/appointments/appointmentForm.css';
import { checkEmployeeAvailability, isOverlapping } from '../../services/availabilityService';


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

  useEffect(() => {
    setFormData(getInitialAppointmentFormValues(appointment));

    // Seleccionar el servicio actual si está editando
    if (appointment) {
      const service = services.find(s => s.id === appointment.service) || null;
      setSelectedService(service);
    }
  }, [appointment, services]);

  // Cuando cambia el servicio, actualizar la hora de fin basado en la duración
  useEffect(() => {
    if (selectedService && formData.start_time) {
      const [hours, minutes] = formData.start_time.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);

      const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      setFormData(prev => ({
        ...prev,
        end_time: endTime
      }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Manejar servicios para calcular automáticamente la hora de fin
    if (name === 'service') {
      const serviceId = Number(value);
      const service = services.find(s => s.id === serviceId) || null;
      setSelectedService(service);
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

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Si hay un conflicto de disponibilidad, mostrar error
    if (availabilityError) {
      // Podemos optar por impedir el envío o permitirlo con una confirmación
      // Aquí optamos por impedir el envío
      return;
    }

    const formErrors = validateAppointmentForm(formData);
    setErrors(formErrors);

    if (Object.keys(formErrors).length > 0) return;

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
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
            {errors.client && <span className="error-message">{errors.client}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="service">Servicio</label>
            <select
              id="service"
              name="service"
              value={formData.service}
              onChange={handleChange}
              className={errors.service ? 'form-input error' : 'form-input'}
            >
              <option value="0">Seleccione un servicio...</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} (${service.price} - {service.duration} min)
                </option>
              ))}
            </select>
            {errors.service && <span className="error-message">{errors.service}</span>}
            {selectedService && (
              <div className="service-info">
                <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
                <p><strong>Precio:</strong> ${selectedService.price}</p>
              </div>
            )}
          </div>

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
              />
              {errors.start_time && <span className="error-message">{errors.start_time}</span>}
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
              />
              {errors.end_time && <span className="error-message">{errors.end_time}</span>}
              {selectedService && (
                <span className="help-text">Calculado automáticamente en base a la duración del servicio</span>
              )}
            </div>
          </div>

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
              {employees.map(employee => (
                <option key={employee.id} value={employee.id}>
                  {employee.first_name} {employee.last_name}
                </option>
              ))}
            </select>
            {errors.employee && <span className="error-message">{errors.employee}</span>}
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
              className={availabilityError ? "save-button disabled" : "save-button"}
              disabled={!!availabilityError}
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