import { Appointment } from "../../hooks/useAppointments";
import { Client } from "../../hooks/useClients";
import { Service, ServiceCategory } from "../../hooks/useServices";
import { User } from "../../hooks/useUsers";
import { AppointmentFormValues } from "../../forms/appointmentsFormValues";

export interface AppointmentFormModalProps {
  appointment: Appointment | null;
  clients: Client[];
  services: Service[];
  employees: User[];
  allAppointments: Appointment[];
  onClose: () => void;
  onSave: (appointmentData: AppointmentFormValues) => void;
  onCheckAvailability: (
    date: string,
    startTime: string,
    serviceId: number
  ) => Promise<void>;
  fetchCategoriesByEmployee: (employeeId: number) => Promise<ServiceCategory[]>;
  fetchEmployeesByService: (serviceId: number) => Promise<User[]>;
  initialDate?: string;
  initialTime?: string;
}