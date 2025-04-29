/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  useAppointments,
  Appointment,
  AppointmentFormData,
  AppointmentFilters,
} from "../../hooks/useAppointments";
import { useClients } from "../../hooks/useClients";
import { useServices, Service } from "../../hooks/useServices";
import { useUsers, User } from "../../hooks/useUsers";
import AppointmentFormModal from "../../components/appointments/AppointmentFormModal";
import AppointmentDetail from "../../components/appointments/AppointmentDetail";
import CalendarView from "../../components/appointments/CalendarView";
import DataTable from "../../components/common/DataTable";
import { createColumnHelper } from "@tanstack/react-table";
import { format, parseISO } from "date-fns";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./appointments.css";
import { es } from "date-fns/locale/es";
import AddIcon from "@mui/icons-material/Add";

// Tipo para las pestañas
type TabType = "list" | "calendar";

const AppointmentsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>("list");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [, setAvailableEmployees] = useState<User[]>([]);
  const [filterDate, setFilterDate] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filters, setFilters] = useState<AppointmentFilters>({});
  const [, setAvailableServices] = useState<Service[]>([]);

  // Hooks para obtener datos
  const {
    appointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    changeAppointmentStatus,
    checkEmployeeAvailability,
    fetchAvailableServices
  } = useAppointments();

  const { clients, fetchClients } = useClients();
  const { services, fetchServices } = useServices();
  const { users: employees, fetchUsers } = useUsers();

  const formatDate = (dateString: string): string => {
    try {
      const date = parseISO(dateString);
      return format(date, "EEEE, d 'de' MMMM", { locale: es });
    } catch (error) {
      return dateString;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    // Cargar todos los datos necesarios
    fetchClients();
    fetchServices();
    fetchUsers();
    
    // Cargar servicios disponibles para citas (con categorías activas)
    const loadAvailableServices = async () => {
      const services = await fetchAvailableServices();
      setAvailableServices(services);
    };
    loadAvailableServices();

    // Configurar filtro por defecto (hoy)
    const today = format(new Date(), "yyyy-MM-dd");
    setFilterDate(today);

    // Cargar citas iniciales
    const initialFilters: AppointmentFilters = {
      date_from: today,
      date_to: today,
    };
    setFilters(initialFilters);
    fetchAppointments(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cuando cambian los filtros, actualizar las citas
  useEffect(() => {
    fetchAppointments(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Cambiar pestaña
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);

    // Si cambiamos a calendario, cargar todas las citas del mes actual
    if (tab === "calendar") {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const calendarFilters: AppointmentFilters = {
        date_from: format(firstDay, "yyyy-MM-dd"),
        date_to: format(lastDay, "yyyy-MM-dd"),
      };

      setFilters(calendarFilters);
    } else {
      // Si volvemos a lista, usar filtro de fecha única
      const today = format(new Date(), "yyyy-MM-dd");

      const listFilters: AppointmentFilters = {
        date_from: filterDate || today,
        date_to: filterDate || today,
      };

      if (filterStatus) {
        listFilters.status = filterStatus;
      }

      setFilters(listFilters);
    }
  };

  // Abrir modal para crear una nueva cita
  const handleAddAppointment = (date?: Date, time?: string) => {
    setSelectedAppointment(null);
    setIsModalOpen(true);

    if (date && time) {
      const formattedDate = format(date, "yyyy-MM-dd");
      setFilterDate(formattedDate);
      setFilters({
        ...filters,
        date_from: formattedDate,
        date_to: formattedDate,
      });
    }
  };

  // Abrir modal para editar una cita existente
  const handleEditAppointment = (appointment: Appointment) => {
    // Verificar si la cita está completada
    if (appointment.status === 'completed') {
      toast.error('Las citas completadas no pueden ser editadas.');
      return;
    }
    
    setSelectedAppointment(appointment);
    setShowDetail(false);
    setIsModalOpen(true);
  };

  // Ver detalles de una cita
  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowDetail(true);
  };

  // Eliminar una cita con confirmación
  const handleDeleteAppointment = async (id: number) => {
    // Verificar si la cita está completada antes de mostrar el diálogo
    const appointmentToDelete = appointments.find(app => app.id === id);
    if (appointmentToDelete && appointmentToDelete.status === 'completed') {
      toast.error('Las citas completadas no pueden ser eliminadas.');
      return;
    }
  
    const result = await Swal.fire({
      title: "¿Eliminar cita?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
  
    if (result.isConfirmed) {
      try {
        await deleteAppointment(id);
        setShowDetail(false);
        toast.success("Cita eliminada correctamente");
      } catch (error: any) {
        console.error("Error al eliminar cita:", error);
        // Mostrar mensaje de error del backend si existe
        if (error.response?.data?.error) {
          toast.error(error.response.data.error);
        } else {
          toast.error("Ocurrió un error al eliminar la cita");
        }
      }
    }
  };

  // Cambiar el estado de una cita
  const handleChangeStatus = async (id: number, status: string) => {
    try {
      // Buscar la cita en el array de citas
      const appointmentToUpdate = appointments.find(app => app.id === id);
      
      // Verificar si la cita existe y está completada
      if (appointmentToUpdate && appointmentToUpdate.status === 'completed') {
        toast.error('Las citas completadas no pueden cambiar de estado.');
        return;
      }
      
      await changeAppointmentStatus(id, status);
      setShowDetail(false);
      toast.success(
        `Estado de la cita actualizado a: ${getStatusText(status)}`
      );
      // Recargar las citas
      fetchAppointments(filters);
    } catch (error: any) {
      console.error("Error al cambiar estado:", error);
      // Mostrar mensaje de error del backend si existe
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Ocurrió un error al cambiar el estado de la cita");
      }
    }
  };

  // Guardar una cita (crear o actualizar)
  const handleSaveAppointment = async (
    appointmentData: AppointmentFormData
  ) => {
    setIsModalOpen(false);

    try {
      if (selectedAppointment) {
        // Actualizar cita existente
        await updateAppointment(selectedAppointment.id, appointmentData);
        toast.success("Cita actualizada correctamente");
      } else {
        // Crear nueva cita
        await createAppointment(appointmentData);
        toast.success("Cita creada correctamente");
      }
      // Recargar las citas
      fetchAppointments(filters);
    } catch (error) {
      console.error("Error al guardar cita:", error);
      toast.error("Ocurrió un error al guardar la cita");
    }
  };

  // Verificar disponibilidad de empleados
  const handleCheckAvailability = async (
    date: string,
    startTime: string,
    serviceId: number
  ) => {
    try {
      const availableEmployeesResult = await checkEmployeeAvailability(
        date,
        startTime,
        serviceId
      );
      setAvailableEmployees(availableEmployeesResult);
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case "pending":
        return "Pendiente";
      case "confirmed":
        return "Confirmada";
      case "cancelled":
        return "Cancelada";
      case "completed":
        return "Completada";
      default:
        return status;
    }
  };

  // Cambiar filtro de fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setFilterDate(newDate);

    const newFilters = { ...filters };
    newFilters.date_from = newDate;
    newFilters.date_to = newDate;
    setFilters(newFilters);
  };

  // Cambiar filtro de estado
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setFilterStatus(newStatus);

    const newFilters = { ...filters };
    if (newStatus) {
      newFilters.status = newStatus;
    } else {
      delete newFilters.status;
    }
    setFilters(newFilters);
  };

  // Manejar clic en fecha en el calendario
  const handleCalendarDateClick = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    setFilterDate(formattedDate);

    // Actualizar filtros para ver citas de ese día
    const newFilters = { ...filters };
    newFilters.date_from = formattedDate;
    newFilters.date_to = formattedDate;
    setFilters(newFilters);

    // Cambiar a la vista de lista
    setActiveTab("list");
  };

  // Crear nueva cita desde el calendario
  const handleNewAppointmentFromCalendar = (date: Date, time: string) => {
    handleAddAppointment(date, time);
  };

  // Definir columnas para DataTable de citas
  const appointmentColumnHelper = createColumnHelper<Appointment>();

  const appointmentColumns = [
    appointmentColumnHelper.accessor("client_name", {
      header: "Cliente",
      cell: (info) => info.getValue(),
    }),
    appointmentColumnHelper.accessor("service_name", {
      header: "Servicio",
      cell: (info) => info.getValue(),
    }),
    appointmentColumnHelper.accessor("employee_name", {
      header: "Empleado",
      cell: (info) => info.getValue(),
    }),
    appointmentColumnHelper.accessor("date", {
      header: "Fecha",
      cell: (info) => formatDate(info.getValue()),
    }),
    appointmentColumnHelper.accessor("start_time", {
      header: "Hora",
      cell: (info) => `${info.getValue()} - ${info.row.original.end_time}`,
    }),
    appointmentColumnHelper.accessor("status", {
      header: "Estado",
      cell: (info) => (
        <span className={`status-badge status-${info.getValue()}`}>
          {getStatusText(info.getValue())}
        </span>
      ),
    }),
    appointmentColumnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => (
        <button
          className="view-button"
          onClick={() => handleViewAppointment(info.row.original)}
        >
          Ver detalle
        </button>
      ),
    }),
  ];

  return (
    <div className="appointments-page">
      <div className="page-header">
        <h2>Gestión de Citas</h2>
      </div>

      {appointmentsError && (
        <div className="error-alert">
          <p>{appointmentsError}</p>
        </div>
      )}

      {/* Pestañas */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === "list" ? "active" : ""}`}
          onClick={() => handleTabChange("list")}
        >
          Lista de Citas
        </button>
        <button
          className={`tab-button ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => handleTabChange("calendar")}
        >
          Calendario
        </button>
      </div>

      {/* Vista de Lista */}
      {activeTab === "list" && (
        <>
          {/* Filtros */}
          <div className="filters-container">
            <div className="filter-group">
              <label htmlFor="filterDate">Fecha:</label>
              <input
                type="date"
                id="filterDate"
                value={filterDate}
                onChange={handleDateChange}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="filterStatus">Estado:</label>
              <select
                id="filterStatus"
                value={filterStatus}
                onChange={handleStatusChange}
                className="filter-input"
              >
                <option value="">Todos</option>
                <option value="pending">Pendiente</option>
                <option value="confirmed">Confirmada</option>
                <option value="cancelled">Cancelada</option>
                <option value="completed">Completada</option>
              </select>
            </div>
            <div className="button-container">
              <button
                className="add-button"
                onClick={() => handleAddAppointment()}
              >
                <AddIcon fontSize="small" /> Crear nueva Cita
              </button>
            </div>
          </div>

          {/* Lista de citas */}
          <div className="appointments-container">
            {appointmentsLoading && appointments.length === 0 ? (
              <p className="loading-message">Cargando citas...</p>
            ) : appointments.length === 0 ? (
              <div className="empty-state">
                <p>No hay citas para los filtros seleccionados</p>
                <button
                  className="add-button"
                  onClick={() => handleAddAppointment()}
                >
                  Crear Nueva Cita
                </button>
              </div>
            ) : (
              <DataTable
                columns={appointmentColumns}
                data={appointments}
                filterPlaceholder="Buscar cita..."
              />
            )}
          </div>
        </>
      )}

      {/* Vista de Calendario */}
      {activeTab === "calendar" && (
        <CalendarView
          appointments={appointments}
          onDateClick={handleCalendarDateClick}
          onEventClick={handleViewAppointment}
          onNewAppointment={handleNewAppointmentFromCalendar}
          handleAddAppointment={handleAddAppointment}
        />
      )}

      {/* Modal para crear/editar cita */}
      {isModalOpen && (
        <AppointmentFormModal
          appointment={selectedAppointment}
          clients={clients}
          services={services} // Pasamos todos los servicios para mantener compatibilidad
          employees={employees}
          allAppointments={appointments}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAppointment}
          onCheckAvailability={handleCheckAvailability}
        />
      )}

      {/* Detalles de cita */}
      {showDetail && selectedAppointment && (
        <div className="detail-overlay">
          <AppointmentDetail
            appointment={selectedAppointment}
            onClose={() => setShowDetail(false)}
            onChangeStatus={(status: string) =>
              handleChangeStatus(selectedAppointment.id, status)
            }
            onEdit={() => handleEditAppointment(selectedAppointment)}
            onDelete={() => handleDeleteAppointment(selectedAppointment.id)}
          />
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;