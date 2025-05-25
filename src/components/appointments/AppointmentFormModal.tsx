import { useState, useEffect, useRef } from "react";
import { Appointment, useAppointments } from "../../hooks/useAppointments";
import { Client, ClientFormData, useClients } from "../../hooks/useClients";
import { Service, ServiceCategory } from "../../hooks/useServices";
import { User } from "../../hooks/useUsers";
import {
  AppointmentFormValues,
  getInitialAppointmentFormValues,
  validateAppointmentForm,
} from "../../forms/appointmentsFormValues";
import "../common/modal.css";
import "../../assets/styles/appointments/appointmentForm.css";
import {
  checkEmployeeAvailability,
  isOverlapping,
} from "../../services/availabilityService";
import { format } from "date-fns";
import { useGroups } from "../../hooks/useGroups";
import ClientsSearchSelect from "../clients/ClientsSearchSelect";
import CategorySearchSelect from "../services/CategorySearchSelect";
import ServiceSearchSelect from "../services/ServiceSearchSelect";
import EmployeeSearchSelect from "../users/EmployeeSearchSelect";
import ClientFormModal from "../clients/ClientFormModal";
import { toast } from "react-toastify";

interface AppointmentFormModalProps {
  appointment: Appointment | null;
  clients: Client[];
  services: Service[];
  employees: User[];
  allAppointments: Appointment[];
  onClose: () => void;
  onSave: (appointmentData: AppointmentFormValues) => void;
  onCheckAvailability: (date: string, startTime: string, serviceId: number) => Promise<void>;
  fetchEmployeesByService: (serviceId: number) => Promise<User[]>;
  initialDate?: string;
  initialTime?: string;
}

const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({
  appointment,
  clients,
  services,
  employees,
  allAppointments,
  onClose,
  onSave,
  onCheckAvailability,
  fetchEmployeesByService,
  initialDate,
  initialTime
}) => {
  const [formData, setFormData] = useState<AppointmentFormValues>(
    getInitialAppointmentFormValues(appointment)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [conflictingAppointment, setConflictingAppointment] = useState<Appointment | null>(null);
  const [cancelledAppointments, setCancelledAppointments] = useState<Appointment[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [, setCategories] = useState<ServiceCategory[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<ServiceCategory[]>([]);
  
  // Nuevo estado para empleados filtrados
  const [availableEmployees, setAvailableEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  
  // Ref para evitar llamadas duplicadas
  const loadingEmployeesRef = useRef<boolean>(false);
  const currentServiceIdRef = useRef<number | null>(null);

  // Usar el hook de citas para obtener los servicios disponibles
  const { fetchAvailableServices } = useAppointments();

  // Referencias para los campos de input que necesitamos manipular
  const startTimeInputRef = useRef<HTMLInputElement>(null);
  const endTimeInputRef = useRef<HTMLInputElement>(null);

  // Obtener fecha y hora actual para las restricciones
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  const currentHourStr = format(now, "HH:mm");
  const minTime = format(now, "HH:mm");

  // Crear nuevo cliente
  const { createClient, fetchClients } = useClients();
  const [showClientModal, setShowClientModal] = useState(false);
  const [activeClientsList, setActiveClientsList] = useState<Client[]>([]);

  // Cargar servicios disponibles para agendar (categoría activa + servicio activo)
  useEffect(() => {
    const loadAvailableServices = async () => {
      if (availableServices.length > 0) return;
      
      try {
        const availableServicesList = await fetchAvailableServices();

        if (appointment && appointment.service) {
          const currentService = services.find((s) => s.id === appointment.service);
          if (currentService && !availableServicesList.some((s) => s.id === currentService.id)) {
            setAvailableServices([...availableServicesList, currentService]);
          } else {
            setAvailableServices(availableServicesList);
          }
        } else {
          setAvailableServices(availableServicesList);
        }
      } catch (error) {
        console.error("Error cargando servicios disponibles:", error);
        const activeServicesList = services.filter((s) => s.is_active);
        setAvailableServices(activeServicesList);
      }
    };

    loadAvailableServices();
  }, [appointment, services, fetchAvailableServices, availableServices.length]);

  // Extraer las categorías únicas de los servicios disponibles
  useEffect(() => {
    if (availableServices.length > 0) {
      const categoriesMap = new Map<number, ServiceCategory>();

      availableServices.forEach((service) => {
        if (service.category && !categoriesMap.has(service.category) && service.category_name) {
          categoriesMap.set(service.category, {
            id: service.category,
            name: service.category_name,
            description: "",
            is_active: true,
          });
        }
      });

      const categoriesArray = Array.from(categoriesMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setCategories(categoriesArray);
      setFilteredCategories(categoriesArray);

      if (appointment && appointment.service) {
        const service = services.find((s) => s.id === appointment.service);
        if (service && service.category) {
          setSelectedCategoryId(service.category);
        }
      }
    }
  }, [availableServices, appointment, services]);

  const { fetchGroups, groups } = useGroups();

  useEffect(() => {
    // Solo cargar grupos si no están cargados ya
    if (groups.length === 0) {
      fetchGroups();
    }
  }, []); // Sin dependencias para evitar bucle infinito

  // Filtrar servicios cuando cambia la categoría seleccionada
  useEffect(() => {
    if (selectedCategoryId) {
      const servicesInCategory = availableServices.filter(
        (service) => service.category === selectedCategoryId
      );
      setFilteredServices(servicesInCategory);
    } else {
      setFilteredServices(availableServices);
    }
  }, [selectedCategoryId, availableServices]);

  // FIXED: Cargar empleados cuando se selecciona un servicio - SIN BUCLE INFINITO
  useEffect(() => {
    const loadEmployeesByService = async () => {
      if (!selectedService) {
        // Si no hay servicio seleccionado, mostrar todos los empleados activos
        const activeUsers = employees.filter((user) => user.is_active);
        setAvailableEmployees(activeUsers);
        currentServiceIdRef.current = null;
        return;
      }

      // Evitar llamadas duplicadas
      if (loadingEmployeesRef.current || currentServiceIdRef.current === selectedService.id) {
        return;
      }

      loadingEmployeesRef.current = true;
      currentServiceIdRef.current = selectedService.id;
      setEmployeesLoading(true);

      try {
        const serviceEmployees = await fetchEmployeesByService(selectedService.id);
        setAvailableEmployees(serviceEmployees);
        
        // Si estamos creando una nueva cita y el empleado actual no está disponible, resetear
        if (!appointment && formData.employee && serviceEmployees.length > 0) {
          const isCurrentEmployeeAvailable = serviceEmployees.some(emp => emp.id === formData.employee);
          if (!isCurrentEmployeeAvailable) {
            setFormData(prev => ({ ...prev, employee: 0 }));
          }
        }
      } catch (error) {
        console.error("Error cargando empleados por servicio:", error);
        // Fallback: usar todos los empleados activos
        const activeUsers = employees.filter((user) => user.is_active);
        setAvailableEmployees(activeUsers);
      } finally {
        setEmployeesLoading(false);
        loadingEmployeesRef.current = false;
      }
    };

    loadEmployeesByService();
  }, [selectedService?.id, fetchEmployeesByService, employees]);

  // Inicializar formData con valores predeterminados o proporcionados
  useEffect(() => {
    const initialData = getInitialAppointmentFormValues(appointment);

    if (!appointment && initialDate) {
      initialData.date = initialDate;
    } else if (!appointment) {
      initialData.date = today;
    }

    if (!appointment && initialTime) {
      initialData.start_time = initialTime;
    }

    setFormData(initialData);

    if (appointment) {
      const service = services.find((s) => s.id === appointment.service) || null;
      setSelectedService(service);

      if (service && service.category) {
        setSelectedCategoryId(service.category);
      }
    }
  }, [appointment, services, today, initialDate, initialTime]);

  // Cuando cambia el servicio o la hora de inicio, actualizar la hora de fin basado en la duración
  useEffect(() => {
    if (selectedService && formData.start_time) {
      try {
        const [hours, minutes] = formData.start_time.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
        const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

        setFormData((prev) => ({ ...prev, end_time: endTime }));

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
    if (formData.employee && formData.date && formData.start_time && formData.end_time) {
      const appointmentsToCheck = appointment
        ? allAppointments.filter((a) => a.id !== appointment.id)
        : allAppointments;

      const { isAvailable, conflictingAppointment } = checkEmployeeAvailability(
        formData.employee,
        formData.date,
        formData.start_time,
        formData.end_time,
        appointmentsToCheck
      );

      if (!isAvailable && conflictingAppointment) {
        const employeeName = availableEmployees.find((e) => e.id === formData.employee)?.first_name || "El empleado";
        const clientName = conflictingAppointment.client_name;
        const startTime = conflictingAppointment.start_time;
        const endTime = conflictingAppointment.end_time;

        setAvailabilityError(`${employeeName} ya tiene una cita con ${clientName} de ${startTime} a ${endTime} en esta fecha.`);
        setConflictingAppointment(conflictingAppointment);
      } else {
        setAvailabilityError(null);
        setConflictingAppointment(null);
      }

      const cancelledAppts = allAppointments.filter(
        (a) =>
          a.employee === formData.employee &&
          a.date === formData.date &&
          a.status === "cancelled" &&
          isOverlapping(formData.start_time, formData.end_time, a.start_time, a.end_time)
      );

      setCancelledAppointments(cancelledAppts);
    } else {
      setAvailabilityError(null);
      setConflictingAppointment(null);
      setCancelledAppointments([]);
    }
  }, [formData.employee, formData.date, formData.start_time, formData.end_time, allAppointments, appointment, availableEmployees]);

  // Validar la fecha y hora seleccionadas
  useEffect(() => {
    if (formData.date && formData.date < today && !appointment) {
      setErrors((prev) => ({ ...prev, date: "No se pueden agendar citas en fechas pasadas" }));
    } else if (formData.date === today && formData.start_time && formData.start_time < minTime && !appointment) {
      setErrors((prev) => ({ ...prev, start_time: "No se pueden agendar citas en horarios pasados" }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.date;
        delete newErrors.start_time;
        return newErrors;
      });
    }
  }, [formData.date, formData.start_time, today, minTime, appointment]);

  useEffect(() => {
    const filteredClients = clients.filter((client) => client.is_active);
    setActiveClientsList(filteredClients);
  }, [clients]);

  const handleCreateClient = async (clientData: ClientFormData) => {
    try {
      const newClient = await createClient(clientData);
      await fetchClients();
      setActiveClientsList(prevList => [...prevList, newClient]);
      setFormData(prev => ({ ...prev, client: newClient.id }));
      setShowClientModal(false);
      toast.success(`Cliente ${newClient.first_name} ${newClient.last_name} creado y seleccionado`);
      return newClient.id;
    } catch (error) {
      console.error("Error al crear cliente:", error);
      toast.error("Ocurrió un error al crear el cliente");
      return 0;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "category") {
      const categoryId = value ? Number(value) : null;
      setSelectedCategoryId(categoryId);
      setFormData((prev) => ({ ...prev, service: 0, employee: 0 }));
      setSelectedService(null);
      // Reset employees when category changes
      const activeUsers = employees.filter((user) => user.is_active);
      setAvailableEmployees(activeUsers);
      return;
    }

    if (name === "service") {
      const serviceId = Number(value);
      const service = availableServices.find((s) => s.id === serviceId) || null;
      setSelectedService(service);
      
      // Resetear empleado cuando cambia el servicio
      setFormData((prev) => ({ ...prev, service: serviceId, employee: 0 }));

      if (service && formData.start_time) {
        try {
          const [hours, minutes] = formData.start_time.split(":").map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);

          const endDate = new Date(startDate.getTime() + service.duration * 60000);
          const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

          setFormData((prev) => ({ ...prev, end_time: endTime, service: serviceId, employee: 0 }));

          if (endTimeInputRef.current) {
            endTimeInputRef.current.value = endTime;
          }
        } catch (error) {
          console.error("Error calculando la hora de fin:", error);
        }
      }
      return;
    }

    if ((name === "date" || name === "start_time" || name === "employee") && formData.service && onCheckAvailability) {
      const date = name === "date" ? value : formData.date;
      const startTime = name === "start_time" ? value : formData.start_time;

      if (date && startTime) {
        onCheckAvailability(date, startTime, formData.service);
      }
    }

    if (name === "date" && value < today && !appointment) {
      setErrors((prev) => ({ ...prev, date: "No se pueden agendar citas en fechas pasadas" }));
    } else if (name === "date") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.date;
        return newErrors;
      });
    }

    if (name === "start_time" && formData.date === today && value < minTime && !appointment) {
      setErrors((prev) => ({ ...prev, start_time: "No se pueden agendar citas en horarios pasados" }));
    } else if (name === "start_time") {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.start_time;
        return newErrors;
      });

      if (selectedService) {
        try {
          const [hours, minutes] = value.split(":").map(Number);
          const startDate = new Date();
          startDate.setHours(hours, minutes, 0, 0);

          const endDate = new Date(startDate.getTime() + selectedService.duration * 60000);
          const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

          setFormData((prev) => ({ ...prev, start_time: value, end_time: endTime }));

          if (endTimeInputRef.current) {
            endTimeInputRef.current.value = endTime;
          }
        } catch (error) {
          console.error("Error calculando la hora de fin:", error);
          setFormData((prev) => ({ ...prev, start_time: value }));
        }
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name === "service" || name === "client" || name === "employee" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (availabilityError) {
      return;
    }

    if (formData.date < today && !appointment) {
      setErrors((prev) => ({ ...prev, date: "No se pueden agendar citas en fechas pasadas" }));
      return;
    }

    if (formData.date === today && formData.start_time < minTime && !appointment) {
      setErrors((prev) => ({ ...prev, start_time: "No se pueden agendar citas en horarios pasados" }));
      return;
    }

    const formErrors = validateAppointmentForm(formData);
    setErrors((prevErrors) => ({ ...prevErrors, ...formErrors }));

    if (Object.keys(formErrors).length > 0) return;

    onSave(formData);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container appointment-form-modal">
        <div className="modal-header">
          <h3>{appointment ? "Editar Cita" : "Nueva Cita"}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
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

          {/* Cliente */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="client">Cliente</label>
              <ClientsSearchSelect
                clients={activeClientsList}
                value={formData.client}
                onChange={(clientId) => setFormData((prev) => ({ ...prev, client: clientId }))}
                onAddNew={() => setShowClientModal(true)}
                disabled={false}
                error={!!errors.client}
                id="client"
                name="client"
              />
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>
          </div>

          {/* Categoría y Servicio con SearchSelect */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoría de Servicio</label>
              <CategorySearchSelect
                categories={filteredCategories}
                value={selectedCategoryId}
                onChange={(categoryId) => {
                  setSelectedCategoryId(categoryId);
                  setFormData((prev) => ({ ...prev, service: 0, employee: 0 }));
                  setSelectedService(null);
                  const activeUsers = employees.filter((user) => user.is_active);
                  setAvailableEmployees(activeUsers);
                }}
                error={!!errors.category}
                id="category"
                name="category"
                placeholder="Seleccione una categoría..."
              />
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="service">Servicio</label>
              <ServiceSearchSelect
                services={filteredServices}
                value={formData.service}
                onChange={(serviceId) => {
                  const service = availableServices.find((s) => s.id === serviceId) || null;
                  setSelectedService(service);
                  setFormData((prev) => ({ ...prev, service: serviceId, employee: 0 }));

                  if (service && formData.start_time) {
                    try {
                      const [hours, minutes] = formData.start_time.split(":").map(Number);
                      const startDate = new Date();
                      startDate.setHours(hours, minutes, 0, 0);

                      const endDate = new Date(startDate.getTime() + service.duration * 60000);
                      const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;

                      setFormData((prev) => ({ ...prev, end_time: endTime, service: serviceId, employee: 0 }));

                      if (endTimeInputRef.current) {
                        endTimeInputRef.current.value = endTime;
                      }
                    } catch (error) {
                      console.error("Error calculando la hora de fin:", error);
                    }
                  }
                }}
                disabled={!selectedCategoryId}
                error={!!errors.service}
                id="service"
                name="service"
                placeholder="Seleccione un servicio..."
              />
              {errors.service && <span className="error-message">{errors.service}</span>}
            </div>
          </div>

          {/* Información del servicio seleccionado */}
          {selectedService && (
            <div className="service-info">
              <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
              <p><strong>Precio:</strong> ${selectedService.price}</p>
            </div>
          )}

          {/* Empleado con SearchSelect */}
          <div className="form-group">
            <label htmlFor="employee">
              Empleado 
              {employeesLoading && <span style={{color: '#6b7280', fontSize: '12px'}}> (Cargando empleados disponibles...)</span>}
            </label>
            <EmployeeSearchSelect
              employees={availableEmployees}
              value={formData.employee}
              onChange={(employeeId) => setFormData((prev) => ({ ...prev, employee: employeeId }))}
              disabled={!selectedService}
              loading={employeesLoading}
              error={!!errors.employee}
              id="employee"
              name="employee"
              placeholder={
                employeesLoading 
                  ? "Cargando empleados..." 
                  : selectedService 
                    ? "Seleccione un empleado..." 
                    : "Primero seleccione un servicio"
              }
              groups={groups}
            />
            {errors.employee && <span className="error-message">{errors.employee}</span>}
            {selectedService && availableEmployees.length === 0 && !employeesLoading && (
              <span className="help-text" style={{color: '#dc2626'}}>
                No hay empleados disponibles para este servicio
              </span>
            )}
          </div>

          {/* Fecha y Horas */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Fecha</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className={errors.date ? "form-input error" : "form-input"}
                min={today}
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
                className={errors.start_time ? "form-input error" : "form-input"}
                ref={startTimeInputRef}
                min={formData.date === today ? minTime : "06:00"}
                max="23:59"
                step="60"
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
                className={errors.end_time ? "form-input error" : "form-input"}
                readOnly={!!selectedService}
                ref={endTimeInputRef}
                min={formData.start_time}
                max="23:59"
                step="60"
              />
              {errors.end_time && <span className="error-message">{errors.end_time}</span>}
              {selectedService && (
                <span className="help-text">
                  Calculado automáticamente en base a la duración del servicio
                </span>
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
                className={errors.status ? "form-input error" : "form-input"}
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
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={
                availabilityError || Object.keys(errors).length > 0
                  ? "save-button disabled"
                  : "save-button"
              }
              disabled={!!availabilityError || Object.keys(errors).length > 0}
            >
              Guardar
            </button>
          </div>
        </form>
        
        {showClientModal && (
          <ClientFormModal
            client={null}
            onClose={() => setShowClientModal(false)}
            onSave={handleCreateClient}
          />
        )}
      </div>
    </div>
  );
};

export default AppointmentFormModal;