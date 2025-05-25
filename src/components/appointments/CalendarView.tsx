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
  handleAddAppointment: () => void;
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

  useEffect(() => {
    const updateCalendarHeight = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    updateCalendarHeight();
    window.addEventListener('resize', updateCalendarHeight);
    return () => window.removeEventListener('resize', updateCalendarHeight);
  }, []);

  const getDurationInMinutes = (start: string, end: string): number => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em) - (sh * 60 + sm);
  };

  const events = appointments.map((appointment) => {
    let backgroundColor = "#fbbf24";
    if (appointment.status === "confirmed") backgroundColor = "#10b981";
    if (appointment.status === "cancelled") backgroundColor = "#ef4444";
    if (appointment.status === "completed") backgroundColor = "#3b82f6";

    const duration = getDurationInMinutes(
      appointment.start_time,
      appointment.end_time
    );

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
      classNames: duration < 30 ? ["short-event"] : ["long-event"],
    };
  });

  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    onEventClick(appointment);
  };

  const handleDateClick = (info: any) => {
    if (calendarView === 'dayGridMonth') {
      const date = info.date;
      const appointmentDate = new Date(date);
      appointmentDate.setHours(9, 0, 0);
      onNewAppointment(appointmentDate, '09:00');
    } else {
      const date = info.date;
      const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
      onNewAppointment(date, time);
    }
  };

  const handleDateSelect = (info: any) => {
    const date = info.start;
    const time = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
    onNewAppointment(date, time);
  };

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
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            omitZeroMinute: false,
            meridiem: false,
            hour12: false
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
        />
      </div>
    </div>
  );
};

export default CalendarView;
