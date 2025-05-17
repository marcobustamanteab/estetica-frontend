/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Swal from 'sweetalert2';
import {
  useAppointments,
  Appointment,
  AppointmentFilters,
} from "../hooks/useAppointments";
import { useNavigate } from "react-router-dom";
import Counter from "../components/common/Counter";
import MiniCalendar from "../components/dashboard/MiniCalendar";
import UpcomingAppointments from "../components/dashboard/UpcomingAppoinments";
import AppointmentDetail from "../components/appointments/AppointmentDetail";
import AppointmentFormModal from "../components/appointments/AppointmentFormModal";
import { format, startOfMonth, endOfMonth } from "date-fns";
import "./dashboard.css";
import { useClients } from "../hooks/useClients";
import { useServices } from "../hooks/useServices";
import { useUsers } from "../hooks/useUsers";
import { toast } from 'react-toastify';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [, setSelectedDate] = useState<string>("");
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<Date | null>(
    null
  );
  const [newAppointmentTime, setNewAppointmentTime] = useState<string>("");
  const { fetchClients, clients } = useClients();
  const { fetchUsers, users } = useUsers();
  const { fetchServices, services, fetchCategoriesByEmployee } = useServices();
  const [totalClients, setTotalClients] = useState<number>(0);
  const [todayAppointments, setTodayAppointments] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [monthlySales, setMonthlySales] = useState<number>(0);

  const {
    appointments,
    fetchAppointments,
    changeAppointmentStatus,
    createAppointment,
    updateAppointment,
    checkEmployeeAvailability,
    deleteAppointment,
  } = useAppointments();

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchClients();
    fetchServices();
    fetchUsers();

    // Obtener fecha actual
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);

    // Filtros para citas del mes actual
    const filters: AppointmentFilters = {
      date_from: format(firstDayOfMonth, "yyyy-MM-dd"),
      date_to: format(lastDayOfMonth, "yyyy-MM-dd"),
    };

    fetchAppointments(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar el componente

  // Actualizar total de clientes cuando cambie la lista de clientes
  useEffect(() => {
    setTotalClients(clients.length);
  }, [clients]);

  // Contar las citas de hoy y calcular ventas diarias y mensuales
  useEffect(() => {
    if (appointments.length === 0 || services.length === 0) return;

    // Filtrar las citas de hoy
    const today = format(new Date(), "yyyy-MM-dd");
    const appointmentsToday = appointments.filter(
      (appointment) => appointment.date === today
    );

    // Actualizar el contador de citas activas (pendientes y confirmadas)
    const activeAppointments = appointmentsToday.filter(
      (appointment) =>
        appointment.status === "pending" || appointment.status === "confirmed"
    );
    setTodayAppointments(activeAppointments.length);

    // Calcular ventas del día (citas completadas)
    const completedAppointments = appointmentsToday.filter(
      (appointment) => appointment.status === "completed"
    );

    // Sumar los precios de los servicios de las citas completadas
    let dailySalesTotal = 0;
    completedAppointments.forEach((appointment) => {
      const service = services.find((s) => s.id === appointment.service);
      if (service) {
        dailySalesTotal += service.price;
      }
    });

    setTotalSales(dailySalesTotal);

    // Calcular ventas mensuales (todas las citas completadas del mes)
    const completedMonthlyAppointments = appointments.filter(
      (appointment) => appointment.status === "completed"
    );

    let monthlySalesTotal = 0;
    completedMonthlyAppointments.forEach((appointment) => {
      const service = services.find((s) => s.id === appointment.service);
      if (service) {
        monthlySalesTotal += service.price;
      }
    });

    setMonthlySales(monthlySalesTotal);
  }, [appointments, services]);

  // Manejar clic en fecha del calendario - Ahora solo actualiza la fecha seleccionada
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    navigate(`/agenda?date=${date}`);
  };

  // Nuevo manejador para crear cita directamente desde el calendario
  const handleNewAppointmentFromCalendar = (date: Date, time: string) => {
    // Extraer componentes locales de la fecha
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Crear una fecha nueva basada en componentes locales
    const appointmentDate = new Date(year, month, day);

    // Guardar la fecha y hora para el formulario
    setNewAppointmentDate(appointmentDate);
    setNewAppointmentTime(time);
    setSelectedAppointment(null);

    // Mostrar el formulario de cita
    setShowAppointmentForm(true);
  };

  // Manejar clic en cita (tanto desde UpcomingAppointments como desde MiniCalendar)
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetail(true);
  };

  // Manejar cambio de estado de cita
  const handleChangeStatus = async (status: string) => {
    if (!selectedAppointment) return;

    try {
      await changeAppointmentStatus(selectedAppointment.id, status);
      setShowAppointmentDetail(false);
      
      // Añadir notificación según el estado
      switch (status) {
        case 'confirmed':
          toast.success('Cita confirmada correctamente');
          break;
        case 'cancelled':
          toast.info('Cita cancelada correctamente');
          break;
        case 'completed':
          toast.success('Cita marcada como completada');
          break;
        default:
          toast.success(`Estado de cita actualizado a: ${status}`);
      }

      // Recargar citas
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);

      const filters: AppointmentFilters = {
        date_from: format(firstDayOfMonth, "yyyy-MM-dd"),
        date_to: format(lastDayOfMonth, "yyyy-MM-dd"),
      };
      fetchAppointments(filters);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      toast.error('Ocurrió un error al cambiar el estado de la cita');
    }
  };

  // Manejar edición de cita
  const handleEditAppointment = () => {
    if (selectedAppointment) {
      navigate(`/agenda?edit=${selectedAppointment.id}`);
    }
  };

  // Manejar eliminación de cita
  const handleDeleteAppointment = () => {
    if (selectedAppointment) {
      // Guardar una referencia a la cita seleccionada
      const appointmentToDelete = selectedAppointment;
      
      // Cerrar el modal de detalles ANTES de mostrar el diálogo de confirmación
      setShowAppointmentDetail(false);
      
      // Pequeño tiempo de espera para asegurar que el modal se cierre
      setTimeout(() => {
        Swal.fire({
          title: "¿Eliminar cita?",
          text: "Esta acción no se puede deshacer",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#dc2626",
          cancelButtonColor: "#64748b",
          confirmButtonText: "Sí, eliminar",
          cancelButtonText: "Cancelar",
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await deleteAppointment(appointmentToDelete.id);
              toast.success('Cita eliminada correctamente');
              
              // Recargar citas
              const today = new Date();
              const firstDayOfMonth = startOfMonth(today);
              const lastDayOfMonth = endOfMonth(today);
      
              const filters: AppointmentFilters = {
                date_from: format(firstDayOfMonth, "yyyy-MM-dd"),
                date_to: format(lastDayOfMonth, "yyyy-MM-dd"),
              };
              fetchAppointments(filters);
            } catch (error) {
              console.error("Error al eliminar cita:", error);
              toast.error('Ocurrió un error al eliminar la cita');
            }
          }
        });
      }, 300); 
    }
  };

  // Manejar la verificación de disponibilidad de empleados
  const handleCheckAvailability = async (
    date: string,
    startTime: string,
    serviceId: number
  ) => {
    try {
      await checkEmployeeAvailability(date, startTime, serviceId);
    } catch (error) {
      console.error("Error al verificar disponibilidad:", error);
    }
  };

  // Manejar el guardado de una cita nueva
  const handleSaveAppointment = async (formData: any) => {
    setShowAppointmentForm(false);

    try {
      if (selectedAppointment) {
        // Actualizar cita existente
        await updateAppointment(selectedAppointment.id, formData);
        // Añadir notificación de éxito
        toast.success('Cita actualizada correctamente');
      } else {
        // Crear cita nueva
        await createAppointment(formData);
        // Añadir notificación de éxito
        toast.success('Cita creada correctamente');
      }

      // Recargar citas
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);

      const filters: AppointmentFilters = {
        date_from: format(firstDayOfMonth, "yyyy-MM-dd"),
        date_to: format(lastDayOfMonth, "yyyy-MM-dd"),
      };
      fetchAppointments(filters);
    } catch (error) {
      console.error("Error al guardar cita:", error);
      toast.error('Ocurrió un error al guardar la cita');
    }
  };

  const handleFetchCategoriesByEmployee = async (employeeId: number) => {
    try {
      return await fetchCategoriesByEmployee(employeeId);
    } catch (error) {
      console.error("Error obteniendo categorías por empleado:", error);
      return []; 
    }
  };

  return (
    <div className="dashboard">
      <h2>Bienvenido, {currentUser?.first_name || currentUser?.username}!</h2>

      <div className="dashboard-cards">
        {/* Tarjeta de Clientes */}
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-info">
              <h3>Clientes</h3>
              <div className="card-value">
                <Counter end={totalClients} />
              </div>
              <p>Total de clientes registrados</p>
            </div>
            <div className="card-icon">
              <Users size={48} />
            </div>
          </div>
        </div>

        {/* Tarjeta de Citas Hoy */}
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-info">
              <h3>Citas hoy</h3>
              <div className="card-value">
                <Counter end={todayAppointments} />
              </div>
              <p>Citas activas para hoy</p>
            </div>
            <div className="card-icon">
              <Calendar size={48} />
            </div>
          </div>
        </div>

        {/* Tarjeta de Ventas Diarias */}
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-info">
              <h3>Ventas Hoy</h3>
              <div className="card-value">
                <Counter end={totalSales} prefix="$" />
              </div>
              <p>Ventas del día</p>
            </div>
            <div className="card-icon">
              <DollarSign size={48} />
            </div>
          </div>
        </div>

        {/* Tarjeta de Ventas Mensuales */}
        <div className="dashboard-card">
          <div className="card-content">
            <div className="card-info">
              <h3>Ventas Mensuales</h3>
              <div className="card-value">
                <Counter end={monthlySales} prefix="$" />
              </div>
              <p>Total de ventas del mes</p>
            </div>
            <div className="card-icon">
              <TrendingUp size={48} />
            </div>
          </div>
        </div>
      </div>

      {/* Widgets: Calendario y Próximas Citas */}
      <div className="dashboard-widgets">
        <div className="mini-calendar-widget">
          <MiniCalendar
            appointments={appointments}
            onDateClick={handleDateClick}
            onAppointmentClick={handleAppointmentClick}
            onNewAppointment={handleNewAppointmentFromCalendar}
          />
        </div>
        <div className="upcoming-appointments-widget">
          <UpcomingAppointments
            appointments={appointments}
            onAppointmentClick={handleAppointmentClick}
          />
        </div>
      </div>

      {/* Modal para detalles de cita */}
      {showAppointmentDetail && selectedAppointment && (
        <div className="detail-overlay">
          <AppointmentDetail
            appointment={selectedAppointment}
            onClose={() => setShowAppointmentDetail(false)}
            onChangeStatus={handleChangeStatus}
            onEdit={handleEditAppointment}
            onDelete={handleDeleteAppointment}
          />
        </div>
      )}

      {/* Modal para crear cita - Nuevo */}
      {showAppointmentForm && (
        <div className="detail-overlay">
          <AppointmentFormModal
            appointment={null}
            clients={clients}
            services={services}
            employees={users}
            allAppointments={appointments}
            onClose={() => setShowAppointmentForm(false)}
            onSave={handleSaveAppointment}
            onCheckAvailability={handleCheckAvailability}
            fetchCategoriesByEmployee={handleFetchCategoriesByEmployee}
            initialDate={
              newAppointmentDate
                ? 
                  `${newAppointmentDate.getFullYear()}-${(
                    newAppointmentDate.getMonth() + 1
                  )
                    .toString()
                    .padStart(2, "0")}-${newAppointmentDate
                    .getDate()
                    .toString()
                    .padStart(2, "0")}`
                : ""
            }
            initialTime={newAppointmentTime}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;