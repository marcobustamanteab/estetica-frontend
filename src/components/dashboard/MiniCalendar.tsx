/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Appointment } from '../../hooks/useAppointments';
import '../../assets/styles/dashboard/miniCalendar.css';

interface MiniCalendarProps {
  appointments: Appointment[];
  onDateClick: (date: string) => void;
  onAppointmentClick: (appointment: Appointment) => void; // Nuevo prop para manejar clics en citas
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
  appointments, 
  onDateClick,
  onAppointmentClick
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [activeView, setActiveView] = useState<'dayGridMonth' | 'timeGridWeek'>('dayGridMonth');

  // Convertir las citas al formato que entiende FullCalendar
  const events = appointments.map(appointment => {
    // Obtener color según estado
    let backgroundColor = '#fbbf24'; // Amarillo para pendiente
    let borderColor = '#fbbf24';
    
    if (appointment.status === 'confirmed') {
      backgroundColor = '#10b981'; // Verde para confirmada
      borderColor = '#10b981';
    } else if (appointment.status === 'cancelled') {
      backgroundColor = '#ef4444'; // Rojo para cancelada
      borderColor = '#ef4444';
    } else if (appointment.status === 'completed') {
      backgroundColor = '#3b82f6'; // Azul para completada
      borderColor = '#3b82f6';
    }

    // Crear el objeto de evento
    return {
      id: appointment.id.toString(),
      title: `${appointment.client_name} - ${appointment.service_name}`,
      start: `${appointment.date}T${appointment.start_time}`,
      end: `${appointment.date}T${appointment.end_time}`,
      backgroundColor,
      borderColor,
      textColor: '#fff',
      extendedProps: {
        appointment: appointment // Guarda toda la información de la cita para acceder a ella luego
      }
    };
  });

  // Manejar clic en fecha
  const handleDateClick = (info: any) => {
    const clickedDate = info.dateStr;
    onDateClick(clickedDate);
  };

  // Manejar clic en evento (cita)
  const handleEventClick = (info: any) => {
    // Acceder a la cita completa desde las propiedades extendidas
    const appointment = info.event.extendedProps.appointment;
    if (appointment) {
      onAppointmentClick(appointment);
    }
  };

  // Cambiar vista (mes o semana)
  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek') => {
    setActiveView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  }

  // Efecto para ajustar la altura del calendario dinámicamente
  useEffect(() => {
    const updateCalendarHeight = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    // Actualizar tamaño inicial y en resize
    updateCalendarHeight();
    window.addEventListener('resize', updateCalendarHeight);

    return () => {
      window.removeEventListener('resize', updateCalendarHeight);
    };
  }, []);

  return (
    <div className="mini-calendar-container">
      <h3 className="widget-title">Calendario</h3>
      <div className="mini-calendar-controls">
        <button 
          className="today-button"
          onClick={() => {
            if (calendarRef.current) {
              const calendarApi = calendarRef.current.getApi();
              calendarApi.today();
              const today = new Date();
              onDateClick(today.toISOString().split('T')[0]);
            }
          }}
        >
          Hoy
        </button>
        <div className="view-toggle">
          <button 
            className={`view-button ${activeView === 'dayGridMonth' ? 'active' : ''}`}
            onClick={() => handleViewChange('dayGridMonth')}
          >
            Mes
          </button>
          <button 
            className={`view-button ${activeView === 'timeGridWeek' ? 'active' : ''}`}
            onClick={() => handleViewChange('timeGridWeek')}
          >
            Semana
          </button>
        </div>
      </div>
      <div className="mini-calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick} // Activar clic en eventos
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next'
          }}
          height="auto" 
          aspectRatio={1.35}
          dayMaxEventRows={3}
          eventDisplay="block"
          buttonIcons={false}
          buttonText={{
            prev: '',
            next: ''
          }}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          eventContent={(eventInfo) => {
            return (
              <div className="fc-event-custom-content" 
                   title={`${eventInfo.event.extendedProps.appointment.client_name} - ${eventInfo.event.extendedProps.appointment.service_name}`}>
                <div className="fc-event-time">
                  {eventInfo.timeText}
                </div>
                <div className="fc-event-title">
                  {eventInfo.event.title}
                </div>
              </div>
            );
          }}
          dayHeaderFormat={{
            weekday: 'short'
          }}
        />
      </div>
    </div>
  );
};

export default MiniCalendar;