/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
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
  onDateClick,
  onEventClick,
  onNewAppointment,
  handleAddAppointment,
}) => {
  const [calendarView, setCalendarView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("timeGridWeek");
  const calendarRef = useRef<FullCalendar>(null);

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

  // Manejar clic en fecha
  const handleDateClick = (info: any) => {
    onDateClick(info.date);
  };

  // Manejar creación de nueva cita
  const handleDateSelect = (info: any) => {
    const date = info.start;
    const time = `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
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
        />
      </div>
    </div>
  );
};

export default CalendarView;
