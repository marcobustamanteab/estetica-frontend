/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Appointment } from "../../hooks/useAppointments";
import "../../assets/styles/appointments/calendarView.css";
import AddIcon from "@mui/icons-material/Add";

interface CalendarViewProps {
  appointments: Appointment[];
  onDateClick: (date: Date) => void;
  onEventClick: (appointment: Appointment) => void;
  onNewAppointment: (date: Date, time: string) => void;
  handleAddAppointment: () => void; // Handler para el botón de nueva cita
}

const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  onEventClick,
  onNewAppointment,
  handleAddAppointment,
}) => {
  const [calendarView, setCalendarView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("timeGridWeek");
  const calendarRef = useRef<FullCalendar>(null);

  // Efecto para mantener una altura adecuada para el calendario
  useEffect(() => {
    const updateCalendarHeight = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    updateCalendarHeight();
    window.addEventListener('resize', updateCalendarHeight);

    return () => {
      window.removeEventListener('resize', updateCalendarHeight);
    };
  }, []);

  // Convertir las citas al formato que entiende FullCalendar
  const events = appointments.map((appointment) => {
    // Obtener color según estado
    let backgroundColor = "#fbbf24"; // Amarillo para pendiente
    if (appointment.status === "confirmed") backgroundColor = "#10b981"; // Verde para confirmada
    if (appointment.status === "cancelled") backgroundColor = "#ef4444"; // Rojo para cancelada
    if (appointment.status === "completed") backgroundColor = "#3b82f6"; // Azul para completada

    // Crear el objeto de evento
    return {
      id: appointment.id.toString(),
      title: `${appointment.client_name} - ${appointment.service_name}`,
      start: `${appointment.date}T${appointment.start_time}`,
      end: `${appointment.date}T${appointment.end_time}`,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: {
        appointment,
      },
    };
  });

  // Manejar clic en evento (cita)
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    onEventClick(appointment);
  };

  // Manejar clic en fecha - Ahora crea cita directamente cuando es posible
  const handleDateClick = (info: any) => {
    // Si estamos en vista de mes, usamos el comportamiento anterior
    if (calendarView === 'dayGridMonth') {
      const date = info.date;
      
      // Establecer una hora por defecto para agendar (9:00 AM)
      const appointmentDate = new Date(date);
      appointmentDate.setHours(9, 0, 0);
      
      // Crear nueva cita con la fecha y hora predeterminada
      onNewAppointment(appointmentDate, '09:00');
    } else {
      // En vistas de día o semana, usamos la hora exacta del clic
      const date = info.date;
      const time = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
        
      // Crear nueva cita con la fecha y hora seleccionadas
      onNewAppointment(date, time);
    }
  };

  // Manejar creación de nueva cita al seleccionar un rango
  const handleDateSelect = (info: any) => {
    const date = info.start;
    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    
    // Llamar a la función para crear una nueva cita con la fecha y hora seleccionadas
    onNewAppointment(date, time);
  };

  // Función para cambiar la vista del calendario
  const changeView = (
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  ) => {
    setCalendarView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-title-section">
          <h3>Calendario de Citas</h3>
          <div className="view-selector mt-3">
            <button
              className={calendarView === "timeGridDay" ? "active" : ""}
              onClick={() => changeView("timeGridDay")}
            >
              Día
            </button>
            <button
              className={calendarView === "timeGridWeek" ? "active" : ""}
              onClick={() => changeView("timeGridWeek")}
            >
              Semana
            </button>
            <button
              className={calendarView === "dayGridMonth" ? "active" : ""}
              onClick={() => changeView("dayGridMonth")}
            >
              Mes
            </button>
          </div>
        </div>
        <div className="calendar-actions">
          <button className="add-button" onClick={handleAddAppointment}>
            <AddIcon fontSize="small" /> Crear nueva Cita
          </button>
        </div>
      </div>

      <div className="calendar-wrapper">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "",
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
          // Mejorar el formato de hora para los slots
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false, // Mostrará '7:00' en lugar de solo '7'
            meridiem: false,
            hour12: false
          }}
          // Mejorar el formato de hora para los eventos
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          // Personalizar el contenido de los eventos
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
        />
      </div>
    </div>
  );
};

export default CalendarView;