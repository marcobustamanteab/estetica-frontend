/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/appointments/CalendarView.tsx
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { Appointment } from '../../hooks/useAppointments';
import '../../assets/styles/appointments/calendarView.css';

interface CalendarViewProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onNewAppointment: (date: Date, time: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ 
  appointments, 
  onDateClick,
  onEventClick,
  onNewAppointment
}) => {
  const [calendarView, setCalendarView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'>('timeGridWeek');

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

  // Manejar clic en evento (cita)
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    onEventClick(appointment);
  };

  // Manejar clic en fecha
  const handleDateClick = (info: any) => {
    onDateClick(info.date);
  };

  // Manejar creación de nueva cita
  const handleDateSelect = (info: any) => {
    const date = info.start;
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    onNewAppointment(date, time);
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h3>Calendario de Citas</h3>
        <div className="view-selector">
          <button 
            className={calendarView === 'dayGridMonth' ? 'active' : ''} 
            onClick={() => setCalendarView('dayGridMonth')}
          >
            Mes
          </button>
          <button 
            className={calendarView === 'timeGridWeek' ? 'active' : ''} 
            onClick={() => setCalendarView('timeGridWeek')}
          >
            Semana
          </button>
          <button 
            className={calendarView === 'timeGridDay' ? 'active' : ''} 
            onClick={() => setCalendarView('timeGridDay')}
          >
            Día
          </button>
        </div>
      </div>
      
      <div className="calendar-wrapper">
        <FullCalendar
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
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          slotDuration="00:30:00"
          stickyHeaderDates={true}
          height="auto"
          contentHeight={700}
        />
      </div>
    </div>
  );
};

export default CalendarView;