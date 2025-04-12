/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppointments, Appointment, AppointmentFilters } from '../hooks/useAppointments';
import { useNavigate } from 'react-router-dom';
import Counter from '../components/common/Counter';
import MiniCalendar from '../components/dashboard/MiniCalendar';
import UpcomingAppointments from '../components/dashboard/UpcomingAppoinments';
import AppointmentDetail from '../components/appointments/AppointmentDetail';
import { format, parseISO } from 'date-fns';
import './Dashboard.css';
import { useClients } from '../hooks/useClients';
import { useServices } from '../hooks/useServices';
import Breadcrumb from '../components/common/Breadcrumb';


const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showAppointmentDetail, setShowAppointmentDetail] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const { fetchClients, clients } = useClients();
  const { fetchServices, services } = useServices();
  const [totalClients, setTotalClients] = useState<number>(0);
  const [todayAppointments, setTodayAppointments] = useState<number>(0);
  const [totalServices, setTotalServices] = useState<number>(0);
  const [totalSales, setTotalSales] = useState<number>(0);
  
  useEffect(() => {
    fetchClients();
    fetchServices();
  }, []);

  useEffect(() => {
    setTotalClients(clients.length);
  }, [clients]);
  
  useEffect(() => {
    setTotalServices(services.length);
  }, [services]);
  
  const { 
    appointments, 
    fetchAppointments,
    changeAppointmentStatus
  } = useAppointments();

  // Cargar citas al montar
  useEffect(() => {
    // Obtener fecha actual
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Filtros para citas futuras
    const filters: AppointmentFilters = {
      date_from: today
    };
    
    fetchAppointments(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Contar las citas de hoy y calcular ventas
  useEffect(() => {
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
    let salesTotal = 0;
    completedAppointments.forEach(appointment => {
      // Buscar el servicio correspondiente para obtener su precio
      const service = services.find(s => s.id === appointment.service);
      if (service) {
        salesTotal += service.price;
      }
    });
    
    setTotalSales(salesTotal);
  }, [appointments, services]);

  // Manejar clic en fecha del calendario
  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    navigate(`/agenda?date=${date}`);
  };

  // Manejar clic en cita
  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetail(true);
  };

  // Manejar cambio de estado de cita
  const handleChangeStatus = async (id: number, status: string) => {
    try {
      await changeAppointmentStatus(id, status);
      setShowAppointmentDetail(false);
      // Recargar citas
      const today = format(new Date(), 'yyyy-MM-dd');
      const filters: AppointmentFilters = {
        date_from: today
      };
      fetchAppointments(filters);
    } catch (error) {
      console.error('Error al cambiar estado:', error);
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
          <h3>Ventas</h3>
          <div className="card-value">
            <Counter end={totalSales} prefix="$" />
          </div>
          <p>Ventas del día</p>
        </div>
        
        <div className="dashboard-card">
          <h3>Servicios</h3>
          <div className="card-value">
            <Counter end={totalServices} />
          </div>
          <p>Servicios disponibles</p>
        </div>
      </div>
      
      {/* Nuevos widgets: Calendario y Próximas Citas */}
      <div className="dashboard-widgets">
        <div className="mini-calendar-widget">
          <MiniCalendar 
            appointments={appointments}
            onDateClick={handleDateClick}
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
            onChangeStatus={(status) => handleChangeStatus(selectedAppointment.id, status)}
            onEdit={() => navigate(`/agenda?edit=${selectedAppointment.id}`)}
            onDelete={() => {
              navigate(`/agenda?delete=${selectedAppointment.id}`);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;