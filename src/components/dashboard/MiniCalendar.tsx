/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useRef, useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import esLocale from "@fullcalendar/core/locales/es";
import { Appointment } from "../../hooks/useAppointments";
import "../../assets/styles/dashboard/miniCalendar.css";

interface MiniCalendarProps {
  appointments: Appointment[];
  onDateClick: (date: string) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onNewAppointment?: (date: Date, time: string) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({
  appointments,
  onDateClick,
  onAppointmentClick,
  onNewAppointment,
}) => {
  const calendarRef = useRef<FullCalendar>(null);
  const [activeView, setActiveView] = useState<
    "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  >("dayGridMonth");

  // Convertir las citas al formato que entiende FullCalendar
  const events = appointments.map((appointment) => {
    // Obtener color según estado
    let backgroundColor = "#fbbf24"; // Amarillo para pendiente
    let borderColor = "#fbbf24";

    if (appointment.status === "confirmed") {
      backgroundColor = "#10b981"; // Verde para confirmada
      borderColor = "#10b981";
    } else if (appointment.status === "cancelled") {
      backgroundColor = "#ef4444"; // Rojo para cancelada
      borderColor = "#ef4444";
    } else if (appointment.status === "completed") {
      backgroundColor = "#3b82f6"; // Azul para completada
      borderColor = "#3b82f6";
    }

    // Crear el objeto de evento
    return {
      id: appointment.id.toString(),
      title: `${appointment.client_name} - ${appointment.service_name}`,
      start: `${appointment.date}T${appointment.start_time}`,
      end: `${appointment.date}T${appointment.end_time}`,
      backgroundColor,
      borderColor,
      textColor: "#fff",
      extendedProps: {
        appointment: appointment,
      },
    };
  });

  // Manejar clic en fecha
  const handleDateClick = (info: any) => {
  // Importante: info.date es un objeto nativo Date proporcionado por FullCalendar
  // Debemos asegurarnos de extraer los componentes correctos
  
  if (activeView === 'dayGridMonth') {
    if (onNewAppointment) {
      // Extraer año, mes y día DE LA FECHA LOCAL
      const year = info.date.getFullYear();
      const month = info.date.getMonth();
      const day = info.date.getDate();
      
      // Crear una fecha completamente nueva con esos valores para evitar problemas de zona horaria
      const appointmentDate = new Date(year, month, day, 9, 0, 0);
      
      onNewAppointment(appointmentDate, '09:00');
    } else {
      onDateClick(info.dateStr);
    }
  } else {
    // En vistas de hora
    // Extraer componentes locales de fecha y hora
    const date = info.date;
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // Crear una nueva fecha a partir de componentes locales
    const appointmentDate = new Date(year, month, day, hours, minutes, 0);
    
    // Formato de hora
    const time = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    
    if (onNewAppointment) {
      onNewAppointment(appointmentDate, time);
    } else {
      onDateClick(info.dateStr);
    }
  }
};

  // Manejar clic en evento (cita)
  const handleEventClick = (info: any) => {
    const appointment = info.event.extendedProps.appointment;
    if (appointment) {
      onAppointmentClick(appointment);
    }
  };

  // Manejar selección de slot
  const handleDateSelect = (info: any) => {
    if (onNewAppointment) {
      const date = info.start; // Usar el objeto date proporcionado por FullCalendar
      const time = `${date.getHours().toString().padStart(2, "0")}:${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;

      // IMPORTANTE: Pasar date directamente, como en CalendarView
      onNewAppointment(date, time);
    }
  };

  // Cambiar vista (mes, semana o día)
  const handleViewChange = (
    view: "dayGridMonth" | "timeGridWeek" | "timeGridDay"
  ) => {
    setActiveView(view);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(view);
    }
  };

  // Manejar clic en botón "Hoy"
  const handleTodayClick = (e: React.MouseEvent) => {
    // Prevenir comportamiento predeterminado
    e.preventDefault();

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();

      // Simplemente navegar a la fecha actual sin llamar a onDateClick
      calendarApi.today();
    }
  };

  // Efecto para ajustar la altura del calendario
  useEffect(() => {
    const updateCalendarHeight = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.updateSize();
      }
    };

    updateCalendarHeight();
    window.addEventListener("resize", updateCalendarHeight);

    return () => {
      window.removeEventListener("resize", updateCalendarHeight);
    };
  }, []);

  return (
    <div className="mini-calendar-container">
      <h3 className="mini-calendar-widget-title">Calendario</h3>
      <div className="mini-calendar-header-controls">
        <button
          className="mini-calendar-today-button"
          onClick={handleTodayClick}
        >
          Hoy
        </button>
        <div className="mini-calendar-view-toggle">
          <button
            className={`mini-calendar-view-button ${
              activeView === "dayGridMonth" ? "active" : ""
            }`}
            onClick={() => handleViewChange("dayGridMonth")}
          >
            Mes
          </button>
          <button
            className={`mini-calendar-view-button ${
              activeView === "timeGridWeek" ? "active" : ""
            }`}
            onClick={() => handleViewChange("timeGridWeek")}
          >
            Semana
          </button>
          <button
            className={`mini-calendar-view-button ${
              activeView === "timeGridDay" ? "active" : ""
            }`}
            onClick={() => handleViewChange("timeGridDay")}
          >
            Día
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
          eventClick={handleEventClick}
          selectable={true}
          select={handleDateSelect}
          headerToolbar={{
            left: "prev",
            center: "title",
            right: "next",
          }}
          height="auto"
          aspectRatio={1.35}
          dayMaxEventRows={3}
          eventDisplay="block"
          buttonIcons={false}
          buttonText={{
            prev: "",
            next: "",
          }}
          eventTimeFormat={{
            hour: "2-digit",
            minute: "2-digit",
            meridiem: false,
            hour12: false,
          }}
          slotLabelFormat={{
            hour: "2-digit",
            minute: "2-digit",
            omitZeroMinute: false,
            meridiem: false,
            hour12: false,
          }}
          eventContent={(eventInfo) => {
            return (
              <div
                className="fc-event-custom-content"
                title={`${eventInfo.event.extendedProps.appointment.client_name} - ${eventInfo.event.extendedProps.appointment.service_name}`}
              >
                <div className="fc-event-time">{eventInfo.timeText}</div>
                <div className="fc-event-title">{eventInfo.event.title}</div>
              </div>
            );
          }}
          dayHeaderFormat={{
            weekday: "short",
          }}
          slotDuration={"00:30:00"}
          slotMinTime={"07:00:00"}
          slotMaxTime={"21:00:00"}
          allDaySlot={false}
        />
      </div>
    </div>
  );
};

export default MiniCalendar;
