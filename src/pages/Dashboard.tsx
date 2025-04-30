import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments, Appointment, AppointmentFilters } from '../hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import Counter from '../components/common/Counter';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import UpcomingAppointments from '../components/dashboard/UpcomingAppoinments';
import AppointmentDetail from '../components/appointments/AppointmentDetail';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import './dashboard.css';
import { useClients } from '../hooks/useClients';
import { useServices } from '../hooks/useServices';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [, setSelectedDate] = useState<string>('');
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { fetchClients, clients } = useClients();
  const { fetchServices, services } = useServices();
  const [totalClients, setTotalClients] = useState<number>(0);
  const [todayAppointments, setTodayAppointments] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  const [monthlySales, setMonthlySales] = useState<number>(0);
  
  const { 
    appointments, 
    fetchAppointments,
    changeAppointmentStatus
  } = useAppointments();

  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    fetchClients();
    fetchServices();
    
    // Obtener fecha actual
    const today = new Date();
    const firstDayOfMonth = startOfMonth(today);
    const lastDayOfMonth = endOfMonth(today);
    
    // Filtros para citas del mes actual
    const filters: AppointmentFilters = {
      date_from: format(firstDayOfMonth, 'yyyy-MM-dd'),
      date_to: format(lastDayOfMonth, 'yyyy-MM-dd')
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
    const today = format(new Date(), 'yyyy-MM-dd');
    const appointmentsToday = appointments.filter(appointment => 
      appointment.date === today
    );
    
    // Actualizar el contador de citas activas (pendientes y confirmadas)
    const activeAppointments = appointmentsToday.filter(
      appointment => appointment.status === 'pending' || appointment.status === 'confirmed'
    );
    setTodayAppointments(activeAppointments.length);
    
    // Calcular ventas del día (citas completadas)
    const completedAppointments = appointmentsToday.filter(
      appointment => appointment.status === 'completed'
    );
    
    // Sumar los precios de los servicios de las citas completadas
    let dailySalesTotal = 0;
    completedAppointments.forEach(appointment => {
      const service = services.find(s => s.id === appointment.service);
      if (service) {
        dailySalesTotal += service.price;
      }
    });
    
    setTotalSales(dailySalesTotal);
    
    // Calcular ventas mensuales (todas las citas completadas del mes)
    const completedMonthlyAppointments = appointments.filter(
      appointment => appointment.status === 'completed'
    );
    
    let monthlySalesTotal = 0;
    completedMonthlyAppointments.forEach(appointment => {
      const service = services.find(s => s.id === appointment.service);
      if (service) {
        monthlySalesTotal += service.price;
      }
    });
    
    setMonthlySales(monthlySalesTotal);
  }, [appointments, services]);

  // Manejar clic en fecha del calendario
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    navigate(`/agenda?date=${date}`);
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
      
      // Recargar citas
      const today = new Date();
      const firstDayOfMonth = startOfMonth(today);
      const lastDayOfMonth = endOfMonth(today);
      
      const filters: AppointmentFilters = {
        date_from: format(firstDayOfMonth, 'yyyy-MM-dd'),
        date_to: format(lastDayOfMonth, 'yyyy-MM-dd')
      };
      fetchAppointments(filters);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
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
      navigate(`/agenda?delete=${selectedAppointment.id}`);
    }
  };

  return (
    <div className="dashboard">
      <h2>Bienvenido, {currentUser?.first_name || currentUser?.username}!</h2>
      
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Clientes</h3>
          <div className="card-value">
            <Counter end={totalClients} />
          </div>
          <p>Total de clientes registrados</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Citas hoy</h3>
          <div className="card-value">
            <Counter end={todayAppointments} />
          </div>
          <p>Citas activas para hoy</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Ventas Hoy</h3>
          <div className="card-value">
            <Counter end={totalSales} prefix="$" />
          </div>
          <p>Ventas del día</p>
        </div>
        
        <div className="dashboard-card monthly-sales-card">
          <h3>Ventas Mensuales</h3>
          <div className="card-value">
            <Counter end={monthlySales} prefix="$" />
          </div>
          <p>Total de ventas del mes</p>
        </div>
      </div>
      
      {/* Widgets: Calendario y Próximas Citas */}
      <div className="dashboard-widgets">
        <div className="mini-calendar-widget">
          <MiniCalendar 
            appointments={appointments}
            onDateClick={handleDateClick}
            onAppointmentClick={handleAppointmentClick}
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
    </div>
  );
};

export default Dashboard;