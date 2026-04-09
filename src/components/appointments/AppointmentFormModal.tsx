/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useAuth } from '../../context/AuthContext';

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function MiniCalendarDropdown({
  selected,
  onSelect,
  minDate,
}: {
  selected: string;
  onSelect: (d: string) => void;
  minDate: string;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const [month, setMonth] = useState(selected ? new Date(selected + "T00:00:00").getMonth() : today.getMonth());
  const [year, setYear] = useState(selected ? new Date(selected + "T00:00:00").getFullYear() : today.getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const formatDisplay = (d: string) => {
    if (!d) return "Selecciona una fecha";
    const dt = new Date(d + "T00:00:00");
    return `${dt.getDate()} de ${MONTHS_ES[dt.getMonth()]} ${dt.getFullYear()}`;
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          padding: "9px 14px",
          border: "1px solid #d1d5db",
          borderRadius: 8,
          background: "white",
          textAlign: "left",
          cursor: "pointer",
          fontSize: 14,
          color: selected ? "#111827" : "#9ca3af",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{formatDisplay(selected)}</span>
        <span style={{ color: "#0d9488", fontSize: 16 }}>📅</span>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          zIndex: 9999,
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 16,
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          width: 280,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button type="button" onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#0d9488", padding: "2px 8px" }}>‹</button>
            <span style={{ fontWeight: 600, fontSize: 14, color: "#111827" }}>{MONTHS_ES[month]} {year}</span>
            <button type="button" onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#0d9488", padding: "2px 8px" }}>›</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
            {DAYS_SHORT.map(d => (
              <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#9ca3af", fontWeight: 600, padding: "2px 0" }}>{d}</div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isPast = dateStr < minDate;
              const isSelected = dateStr === selected;
              const isToday = dateStr === minDate;
              const disabled = isPast;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onSelect(dateStr); setOpen(false); }}
                  style={{
                    border: "none",
                    borderRadius: 6,
                    padding: "7px 0",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: 12,
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? "#0d9488" : isToday ? "#f0fdfa" : "none",
                    color: isSelected ? "white" : disabled ? "#d1d5db" : isToday ? "#0d9488" : "#374151",
                    transition: "all 0.15s",
                  }}
                >{day}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Time Slots ───────────────────────────────────────────────────────────────
function TimeSlotPicker({
  employeeId,
  date,
  allAppointments,
  selectedTime,
  onSelect,
  currentAppointmentId,
  serviceDuration,
}: {
  employeeId: number;
  date: string;
  allAppointments: Appointment[];
  selectedTime: string;
  onSelect: (t: string) => void;
  currentAppointmentId?: number;
  serviceDuration: number;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [closedMsg, setClosedMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!employeeId || !date) { setSlots([]); return; }

    setLoading(true);
    setClosedMsg(null);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    fetch(`${apiUrl}/api/auth/work-schedules/?employee=${employeeId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    })
      .then(r => r.json())
      .then(schedules => {
        const dayOfWeek = new Date(date + "T00:00:00").getDay();
        const adjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const schedule = schedules.find((s: any) => s.day_of_week === adjusted && s.is_active);

        if (!schedule) {
          setClosedMsg("Este barbero/a no trabaja este día.");
          setSlots([]);
          setLoading(false);
          return;
        }

        const allSlots: string[] = [];
        const [sh, sm] = schedule.start_time.split(":").map(Number);
        const [eh, em] = schedule.end_time.split(":").map(Number);
        let cur = sh * 60 + sm;
        const end = eh * 60 + em;
        while (cur < end) {
          allSlots.push(`${String(Math.floor(cur / 60)).padStart(2, "0")}:${String(cur % 60).padStart(2, "0")}`);
          cur += 30;
        }

        const busyRanges = allAppointments
          .filter(a =>
            a.employee === employeeId &&
            a.date === date &&
            (a.status === "pending" || a.status === "confirmed") &&
            a.id !== currentAppointmentId
          )
          .map(a => {
            const [sh, sm] = a.start_time.slice(0, 5).split(":").map(Number);
            const [eh, em] = a.end_time.slice(0, 5).split(":").map(Number);
            return { start: sh * 60 + sm, end: eh * 60 + em };
          });

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' });
        const nowInChile = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
        const currentMinutes = date === todayStr ? nowInChile.getHours() * 60 + nowInChile.getMinutes() : -1;

        setSlots(allSlots.filter(t => {
          const [h, m] = t.split(":").map(Number);
          const slotStart = h * 60 + m;
          const slotEnd = slotStart + serviceDuration;
          if (slotStart <= currentMinutes) return false;
          return !busyRanges.some(r => slotStart < r.end && slotEnd > r.start);
        }));
        setLoading(false);
      })
      .catch(() => { setSlots([]); setLoading(false); });
  }, [employeeId, date]);

  if (!employeeId || !date) return (
    <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0" }}>Selecciona un barbero/a y fecha primero.</p>
  );

  if (loading) return (
    <p style={{ fontSize: 13, color: "#9ca3af", margin: "8px 0" }}>Cargando horarios...</p>
  );

  if (closedMsg) return (
    <p style={{ fontSize: 13, color: "#ef4444", margin: "8px 0" }}>⚠️ {closedMsg}</p>
  );

  if (slots.length === 0) return (
    <p style={{ fontSize: 13, color: "#ef4444", margin: "8px 0" }}>No hay horarios disponibles para esta fecha.</p>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 4 }}>
      {slots.map(t => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          style={{
            border: selectedTime === t ? "2px solid #0d9488" : "2px solid #e5e7eb",
            borderRadius: 8,
            padding: "8px 4px",
            cursor: "pointer",
            background: selectedTime === t ? "#0d9488" : "white",
            color: selectedTime === t ? "white" : "#374151",
            fontWeight: 600,
            fontSize: 13,
            transition: "all 0.15s",
          }}
        >{t}</button>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [availableEmployees, setAvailableEmployees] = useState<User[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState<boolean>(false);
  const [employeeSchedulesMap, setEmployeeSchedulesMap] = useState<Record<number, number[]>>({});

  const { currentUser } = useAuth();
  const loadingEmployeesRef = useRef<boolean>(false);
  const currentServiceIdRef = useRef<number | null>(null);
  const { fetchAvailableServices } = useAppointments();
  const endTimeInputRef = useRef<HTMLInputElement>(null);
  const today = format(new Date(), "yyyy-MM-dd");
  const { createClient, fetchClients } = useClients();
  const [showClientModal, setShowClientModal] = useState(false);
  const [activeClientsList, setActiveClientsList] = useState<Client[]>([]);

  // Cargar servicios disponibles
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
      } catch {
        setAvailableServices(services.filter((s) => s.is_active));
      }
    };
    loadAvailableServices();
  }, [appointment, services, fetchAvailableServices, availableServices.length]);

  // Extraer categorías
  useEffect(() => {
    if (availableServices.length > 0) {
      const categoriesMap = new Map<number, ServiceCategory>();
      availableServices.forEach((service) => {
        if (service.category && !categoriesMap.has(service.category) && service.category_name) {
          categoriesMap.set(service.category, { id: service.category, name: service.category_name, description: "", is_active: true });
        }
      });
      const categoriesArray = Array.from(categoriesMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesArray);
      setFilteredCategories(categoriesArray);
      if (appointment && appointment.service) {
        const service = services.find((s) => s.id === appointment.service);
        if (service && service.category) setSelectedCategoryId(service.category);
      }
    }
  }, [availableServices, appointment, services]);

  const { fetchGroups, groups } = useGroups();
  useEffect(() => { if (groups.length === 0) fetchGroups(); }, []);

  // Filtrar servicios por categoría
  useEffect(() => {
    setFilteredServices(selectedCategoryId
      ? availableServices.filter(s => s.category === selectedCategoryId)
      : availableServices
    );
  }, [selectedCategoryId, availableServices]);

  // Cargar empleados por servicio
  useEffect(() => {
    const loadEmployeesByService = async () => {
      if (!selectedService) {
        const activeUsers = employees.filter(u => u.is_active);
        const inList = activeUsers.some(e => e.id === (currentUser as any)?.id);
        setAvailableEmployees(inList || !(currentUser as any)?.is_active ? activeUsers : [...activeUsers, currentUser as User]);
        currentServiceIdRef.current = null;
        return;
      }
      if (loadingEmployeesRef.current || currentServiceIdRef.current === selectedService.id) return;
      loadingEmployeesRef.current = true;
      currentServiceIdRef.current = selectedService.id;
      setEmployeesLoading(true);
      try {
        const serviceEmployees = await fetchEmployeesByService(selectedService.id);
        const inList = serviceEmployees.some(e => e.id === (currentUser as any)?.id);
        setAvailableEmployees(inList || !(currentUser as any)?.is_active ? serviceEmployees : [...serviceEmployees, currentUser as User]);
        if (!appointment && formData.employee && serviceEmployees.length > 0) {
          if (!serviceEmployees.some(emp => emp.id === formData.employee)) {
            setFormData(prev => ({ ...prev, employee: 0 }));
          }
        }
      } catch {
        const activeUsers = employees.filter(u => u.is_active);
        setAvailableEmployees(activeUsers);
      } finally {
        setEmployeesLoading(false);
        loadingEmployeesRef.current = false;
      }
    };
    loadEmployeesByService();
  }, [selectedService?.id, fetchEmployeesByService, employees, currentUser]);

  // Fetchear schedules cuando cambian los empleados disponibles
  useEffect(() => {
    if (availableEmployees.length === 0) return;
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    availableEmployees.forEach(emp => {
      fetch(`${apiUrl}/api/auth/employees/${emp.id}/schedules/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
      })
        .then(r => r.json())
        .then(data => setEmployeeSchedulesMap(prev => ({ ...prev, [emp.id]: data.working_days || [] })))
        .catch(() => setEmployeeSchedulesMap(prev => ({ ...prev, [emp.id]: [0,1,2,3,4,5,6] })));
    });
  }, [availableEmployees]);

  // Inicializar formData
  useEffect(() => {
    const initialData = getInitialAppointmentFormValues(appointment);
    if (!appointment && initialDate) initialData.date = initialDate;
    else if (!appointment) initialData.date = today;
    if (!appointment && initialTime) initialData.start_time = initialTime;
    setFormData(initialData);
    if (appointment) {
      const service = services.find((s) => s.id === appointment.service) || null;
      setSelectedService(service);
      if (service?.category) setSelectedCategoryId(service.category);
    }
  }, [appointment, services, today, initialDate, initialTime]);

  // Calcular hora fin
  useEffect(() => {
    if (selectedService && formData.start_time) {
      try {
        const [h, m] = formData.start_time.split(":").map(Number);
        const start = new Date();
        start.setHours(h, m, 0, 0);
        const end = new Date(start.getTime() + selectedService.duration * 60000);
        const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
        setFormData(prev => ({ ...prev, end_time: endTime }));
        if (endTimeInputRef.current) endTimeInputRef.current.value = endTime;
      } catch {
        // no-op
      }
    }
  }, [selectedService, formData.start_time]);

  // Verificar disponibilidad
  useEffect(() => {
    if (formData.employee && formData.date && formData.start_time && formData.end_time) {
      const toCheck = appointment
        ? allAppointments.filter(a => a.id !== appointment.id)
        : allAppointments;

      const cancelled = toCheck.filter(a =>
        a.employee === formData.employee &&
        a.date === formData.date &&
        a.status === 'cancelled' &&
        isOverlapping(formData.start_time, formData.end_time, a.start_time, a.end_time)
      );
      setCancelledAppointments(cancelled);

      const { isAvailable, conflictingAppointment: conflict } = checkEmployeeAvailability(
        formData.employee, formData.date, formData.start_time, formData.end_time, toCheck
      );

      if (!isAvailable && conflict) {
        setAvailabilityError(`Conflicto con cita de ${conflict.client_name}`);
        setConflictingAppointment(conflict);
      } else {
        setAvailabilityError(null);
        setConflictingAppointment(null);
      }
    } else {
      setAvailabilityError(null);
      setConflictingAppointment(null);
    }
  }, [formData.employee, formData.date, formData.start_time, formData.end_time, allAppointments, appointment]);

  // Cargar clientes activos
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsList = await fetchClients();
        if (Array.isArray(clientsList)) {
          setActiveClientsList(clientsList.filter((c: Client) => c.is_active !== false));
        } else {
          setActiveClientsList(clients.filter(c => c.is_active !== false));
        }
      } catch {
        setActiveClientsList(clients.filter(c => c.is_active !== false));
      }
    };
    loadClients();
  }, []);

  const handleCreateClient = async (clientData: ClientFormData) => {
    try {
      const newClient = await createClient(clientData);
      const updatedClients = await fetchClients();
      if (Array.isArray(updatedClients)) {
        setActiveClientsList(updatedClients.filter((c: Client) => c.is_active !== false));
      }
      setFormData(prev => ({ ...prev, client: newClient.id }));
      setShowClientModal(false);
      toast.success("Cliente creado exitosamente");
    } catch {
      toast.error("Error al crear el cliente");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === "category") {
      setSelectedCategoryId(value ? Number(value) : null);
      setFormData(prev => ({ ...prev, service: 0, employee: 0 }));
      setSelectedService(null);
      setAvailableEmployees(employees.filter(u => u.is_active));
      return;
    }

    if (name === "service") {
      const serviceId = Number(value);
      const service = availableServices.find(s => s.id === serviceId) || null;
      setSelectedService(service);
      setFormData(prev => ({ ...prev, service: serviceId, employee: 0 }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: name === "service" || name === "client" || name === "employee" ? Number(value) : value,
    }));
  };

  const handleDateSelect = (dateStr: string) => {
    // Resetear empleado si no trabaja el nuevo día seleccionado
    const jsDay = new Date(dateStr + "T00:00:00").getDay();
    const djangoDay = jsDay === 0 ? 6 : jsDay - 1;
    const currentEmployeeDays = formData.employee ? employeeSchedulesMap[formData.employee] : null;
    const employeeWorksThisDay = currentEmployeeDays ? currentEmployeeDays.includes(djangoDay) : true;

    setFormData(prev => ({
      ...prev,
      date: dateStr,
      start_time: "",
      end_time: "",
      employee: employeeWorksThisDay ? prev.employee : 0,
    }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, start_time: time }));
    if (formData.date && formData.service) {
      onCheckAvailability(formData.date, time, formData.service);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (availabilityError) return;
    if (formData.date < today && !appointment) {
      setErrors(prev => ({ ...prev, date: "No se pueden agendar citas en fechas pasadas" }));
      return;
    }
    const formErrors = validateAppointmentForm(formData);
    setErrors(prev => ({ ...prev, ...formErrors }));
    if (Object.keys(formErrors).length > 0) return;
    onSave(formData);
  };

  // Filtrar empleados según el día seleccionado
  const jsDay = formData.date ? new Date(formData.date + "T00:00:00").getDay() : null;
  const djangoDay = jsDay !== null ? (jsDay === 0 ? 6 : jsDay - 1) : null;
  const employeesForSelectedDay = djangoDay !== null
    ? availableEmployees.filter(emp => {
        const days = employeeSchedulesMap[emp.id];
        if (!days) return true;
        return days.includes(djangoDay);
      })
    : availableEmployees;

  return (
    <div className="modal-overlay">
      <div className="modal-container appointment-form-modal">
        <div className="modal-header">
          <h3>{appointment ? "Editar Cita" : "Nueva Cita"}</h3>
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
                  <p><strong>Cita en conflicto:</strong></p>
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
                onChange={clientId => setFormData(prev => ({ ...prev, client: clientId }))}
                onAddNew={() => setShowClientModal(true)}
                disabled={false}
                error={!!errors.client}
                id="client"
                name="client"
              />
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>
          </div>

          {/* Categoría y Servicio */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="category">Categoría de Servicio</label>
              <CategorySearchSelect
                categories={filteredCategories}
                value={selectedCategoryId}
                onChange={categoryId => {
                  setSelectedCategoryId(categoryId);
                  setFormData(prev => ({ ...prev, service: 0, employee: 0 }));
                  setSelectedService(null);
                  setAvailableEmployees(employees.filter(u => u.is_active));
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
                onChange={serviceId => {
                  const service = availableServices.find(s => s.id === serviceId) || null;
                  setSelectedService(service);
                  setFormData(prev => ({ ...prev, service: serviceId, employee: 0 }));
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

          {selectedService && (
            <div className="service-info">
              <p><strong>Duración:</strong> {selectedService.duration} minutos</p>
              <p><strong>Precio:</strong> ${selectedService.price}</p>
            </div>
          )}

          {/* Fecha — MOVIDA ANTES DEL EMPLEADO */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Fecha</label>
              <MiniCalendarDropdown
                selected={formData.date}
                onSelect={handleDateSelect}
                minDate={today}
              />
              {errors.date && <span className="error-message">{errors.date}</span>}
            </div>
          </div>

          {/* Empleado — filtrado por día seleccionado */}
          <div className="form-group">
            <label htmlFor="employee">
              Trabajador/a
              {employeesLoading && <span style={{ color: "#6b7280", fontSize: 12 }}> (Cargando...)</span>}
              {formData.date && <span style={{ color: "#6b7280", fontSize: 12 }}> (disponibles para la fecha)</span>}
            </label>
            <EmployeeSearchSelect
              employees={employeesForSelectedDay}
              value={formData.employee}
              onChange={employeeId => {
                setFormData(prev => ({ ...prev, employee: employeeId, start_time: "", end_time: "" }));
              }}
              disabled={!selectedService}
              loading={employeesLoading}
              error={!!errors.employee}
              id="employee"
              name="employee"
              placeholder={
                employeesLoading ? "Cargando barberos/as..."
                : selectedService ? "Seleccione un barbero/a..."
                : "Primero seleccione un servicio"
              }
              groups={groups}
            />
            {errors.employee && <span className="error-message">{errors.employee}</span>}
          </div>

          {/* Hora — Slots */}
          {formData.date && formData.employee ? (
            <div className="form-group">
              <label>Hora de inicio</label>
              <TimeSlotPicker
                employeeId={formData.employee}
                date={formData.date}
                allAppointments={allAppointments}
                selectedTime={formData.start_time}
                onSelect={handleTimeSelect}
                currentAppointmentId={appointment?.id}
                serviceDuration={selectedService?.duration || 30}
              />
              {errors.start_time && <span className="error-message">{errors.start_time}</span>}
            </div>
          ) : (
            <div className="form-group">
              <label>Hora de inicio</label>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: "6px 0" }}>
                {!formData.employee ? "Selecciona un barbero/a primero." : "Selecciona una fecha primero."}
              </p>
            </div>
          )}

          {/* Hora fin oculta */}
          <input type="hidden" name="end_time" value={formData.end_time} ref={endTimeInputRef} />
          {formData.start_time && formData.end_time && selectedService && (
            <p style={{ fontSize: 12, color: "#6b7280", margin: "-8px 0 8px", fontStyle: "italic" }}>
              Hora de fin: {formData.end_time} (calculado según duración del servicio)
            </p>
          )}

          {cancelledAppointments.length > 0 && (
            <div className="cancelled-appointments-info">
              <h4>Citas canceladas en este horario</h4>
              <ul>
                {cancelledAppointments.map((a, i) => (
                  <li key={i}>
                    <strong>{a.client_name}</strong> - {a.service_name}
                    <span className="cancelled-time"> ({a.start_time} - {a.end_time})</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!appointment && (
            <div className="form-group">
              <label htmlFor="status">Estado</label>
              <select id="status" name="status" value={formData.status} onChange={handleChange} className="form-input">
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="notes">Notas adicionales</label>
            <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} className="form-input" rows={3} />
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