/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Appointment } from '../../hooks/useAppointments';
import '../../assets/styles/appointments/calendarView.css';
import AddIcon from '@mui/icons-material/Add';
import { isBefore, startOfDay } from 'date-fns';

interface CalendarViewProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onNewAppointment: (date: Date, time: string) => void;
  handleAddAppointment: () => void; // Handler para el botón de nueva cita
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  appointments, 
  onDateClick,
  onEventClick,
  onNewAppointment,
  handleAddAppointment
}) => {
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');
  const calendarRef = useRef<FullCalendar>(null);
  const [minTime, setMinTime] = useState<string>("07:00:00");
  const validRange = {
    start: startOfDay(new Date())
  };

  // Configurar la hora mínima para hoy cuando sea el día actual
  useEffect(() => {
    // Actualizar la hora mínima para hoy si es necesario
    if (calendarView === 'timeGridDay' || calendarView === 'timeGridWeek') {
      // Obtener la fecha actual del calendario
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        const currentDate = calendarApi.getDate();
        
        // Si la fecha visible es hoy, establecer la hora mínima como la hora actual
        if (isSameDay(currentDate, new Date())) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          // Redondear a la siguiente media hora
          const roundedMinute = currentMinute < 30 ? 30 : 0;
          const roundedHour = currentMinute < 30 ? currentHour : currentHour + 1;
          
          setMinTime(`${roundedHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}:00`);
        } else {
          // Para otros días, hora mínima es el inicio del día laboral
          setMinTime("07:00:00");
        }
      }
    }
  }, [calendarView]);

  // Convertir las citas al formato que entiende FullCalendar
  const events = appointments.map(appointment => {
    // Obtener color según estado
    let backgroundColor = '#fbbf24'; // Amarillo para pendiente
    if (appointment.status === 'confirmed') backgroundColor = '#10b981'; // Verde para confirmada
    if (appointment.status === 'cancelled') backgroundColor = '#ef4444'; // Rojo para cancelada
    if (appointment.status === 'completed') backgroundColor = '#3b82f6'; // Azul para completada

    // Crear el objeto de evento
    return {
      id: appointment.id.toString(),
      title: `${appointment.client_name} - ${appointment.service_name}`,
      start: `${appointment.date}T${appointment.start_time}`,
      end: `${appointment.date}T${appointment.end_time}`,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: {
        appointment
      }
    };
  });

  // Función auxiliar para comprobar si dos fechas son el mismo día
  const isSameDay = (date1: Date, date2: Date): boolean => {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  };

  // Manejar clic en evento (cita)
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    onEventClick(appointment);
  };

  // Manejar clic en fecha
  const handleDateClick = (info: any) => {
    // Ignorar clics en fechas pasadas
    const clickedDate = new Date(info.date);
    const today = startOfDay(new Date());
    
    if (isBefore(clickedDate, today)) {
      // Si es una fecha pasada, no hacer nada o mostrar mensaje
      return;
    }
    
    onDateClick(info.date);
  };

  // Manejar creación de nueva cita
  const handleDateSelect = (info: any) => {
    // Ignorar selecciones en fechas/horas pasadas
    const selectedStart = new Date(info.start);
    const now = new Date();
    
    if (isBefore(selectedStart, now)) {
      // Si es un tiempo pasado, no hacer nada o mostrar mensaje
      return;
    }
    
    const date = info.start;
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    onNewAppointment(date, time);
  };

  // Función para cambiar la vista del calendario
  const changeView = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay') => {
    setCalendarView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
      
      // Actualizar minTime si es necesario
      if (view === 'timeGridDay' || view === 'timeGridWeek') {
        const currentDate = calendarApi.getDate();
        
        if (isSameDay(currentDate, new Date())) {
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          // Redondear a la siguiente media hora
          const roundedMinute = currentMinute < 30 ? 30 : 0;
          const roundedHour = currentMinute < 30 ? currentHour : currentHour + 1;
          
          setMinTime(`${roundedHour.toString().padStart(2, '0')}:${roundedMinute.toString().padStart(2, '0')}:00`);
        } else {
          setMinTime("07:00:00");
        }
      }
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h3>Calendario de Citas</h3>
          <div className="view-selector mt-3">
            <button 
              className={calendarView === 'timeGridDay' ? 'active' : ''} 
              onClick={() => changeView('timeGridDay')}
            >
              Día
            </button>
            <button 
              className={calendarView === 'timeGridWeek' ? 'active' : ''} 
              onClick={() => changeView('timeGridWeek')}
            >
              Semana
            </button>
            <button 
              className={calendarView === 'dayGridMonth' ? 'active' : ''} 
              onClick={() => changeView('dayGridMonth')}
            >
              Mes
            </button>
          </div>
        </div>
        <div className="calendar-actions">
          <button
            className="add-button"
            onClick={handleAddAppointment}
          >
            <AddIcon fontSize="small" /> Crear nueva Cita
          </button>
        </div>
      </div>
      
      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: ''
          }}
          initialView={calendarView}
          locale={esLocale}
          events={events}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          selectable={true}
          selectMirror={true}
          select={handleDateSelect}
          editable={false}
          dayMaxEvents={true}
          slotMinTime={minTime}
          slotMaxTime="21:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          stickyHeaderDates={true}
          height="auto"
          contentHeight={700}
          validRange={validRange}
          selectConstraint={validRange}
          selectAllow={(selectInfo) => {
            // No permitir selecciones en el pasado
            return !isBefore(selectInfo.start, new Date());
          }}
          dayCellClassNames={(args) => {
            // Añadir clase para días pasados
            const cellDate = args.date;
            const today = startOfDay(new Date());
            return isBefore(cellDate, today) ? 'past-day' : '';
          }}
        />
      </div>
    </div>
  );
};

export default CalendarView;