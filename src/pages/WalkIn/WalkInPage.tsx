/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useAppointments } from "../../hooks/useAppointments";
import { useClients, Client, ClientFormData } from "../../hooks/useClients";
import { useServices, Service } from "../../hooks/useServices";
import { useUsers, User } from "../../hooks/useUsers";
import ClientsSearchSelect from "../../components/clients/ClientsSearchSelect";
import ServiceSearchSelect from "../../components/services/ServiceSearchSelect";
import EmployeeSearchSelect from "../../components/users/EmployeeSearchSelect";
import ClientFormModal from "../../components/clients/ClientFormModal";
import { toast } from "react-toastify";
import { format } from "date-fns";
import "./walkIn.css";

interface WalkInFormValues {
  client: number;
  service: number;
  employee: number;
  date: string;
  start_time: string;
  end_time: string;
  notes: string;
}

const emptyForm = (): WalkInFormValues => ({
  client: 0,
  service: 0,
  employee: 0,
  date: format(new Date(), "yyyy-MM-dd"),
  start_time: "",
  end_time: "",
  notes: "",
});

const WalkInPage: React.FC = () => {
  const [form, setForm] = useState<WalkInFormValues>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [activeClients, setActiveClients] = useState<Client[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<User[]>([]);
  const [showClientModal, setShowClientModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { createAppointment, fetchAvailableServices } = useAppointments();
  const { fetchClients, createClient } = useClients();
  const { services, fetchServices } = useServices();
  const { users, fetchUsers } = useUsers();

  const [availableServices, setAvailableServices] = useState<Service[]>([]);

  useEffect(() => {
    const load = async () => {
      fetchServices();
      fetchUsers();
      const clients = await fetchClients();
      if (Array.isArray(clients)) {
        setActiveClients(clients.filter((c: Client) => c.is_active !== false));
      }
      try {
        const avail = await fetchAvailableServices();
        setAvailableServices(avail);
      } catch {
        setAvailableServices(services.filter((s) => s.is_active));
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setActiveEmployees(users.filter((u) => u.is_active));
  }, [users]);

  // Recalcular end_time cuando cambia servicio u hora de inicio
  useEffect(() => {
    if (selectedService && form.start_time) {
      const [h, m] = form.start_time.split(":").map(Number);
      const start = new Date();
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + selectedService.duration * 60000);
      const endTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      setForm((prev) => ({ ...prev, end_time: endTime }));
    }
  }, [selectedService, form.start_time]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.client) e.client = "Debe seleccionar un cliente";
    if (!form.service) e.service = "Debe seleccionar un servicio";
    if (!form.employee) e.employee = "Debe seleccionar un trabajador/a";
    if (!form.date) e.date = "La fecha es obligatoria";
    if (!form.start_time) e.start_time = "La hora de inicio es obligatoria";
    if (!form.end_time) e.end_time = "La hora de fin es obligatoria";
    else if (form.start_time && form.start_time >= form.end_time)
      e.end_time = "La hora de fin debe ser posterior a la de inicio";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleServiceChange = (serviceId: number) => {
    const svc = availableServices.find((s) => s.id === serviceId) || null;
    setSelectedService(svc);
    setForm((prev) => ({ ...prev, service: serviceId, start_time: "", end_time: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createAppointment({
        client: form.client,
        service: form.service,
        employee: form.employee,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: "completed",
        notes: form.notes,
      });
      toast.success("Registro agregado correctamente");
      setForm(emptyForm());
      setSelectedService(null);
      setErrors({});
    } catch (err: any) {
      const msg =
        err?.response?.data?.non_field_errors?.[0] ||
        err?.response?.data?.detail ||
        "Error al guardar el registro";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateClient = async (clientData: ClientFormData) => {
    try {
      const newClient = await createClient(clientData);
      const updated = await fetchClients();
      if (Array.isArray(updated)) {
        setActiveClients(updated.filter((c: Client) => c.is_active !== false));
      }
      setForm((prev) => ({ ...prev, client: newClient.id }));
      setShowClientModal(false);
      toast.success("Cliente creado exitosamente");
    } catch {
      toast.error("Error al crear el cliente");
    }
  };

  return (
    <div className="walkin-page">
      <div className="walkin-header">
        <h2>Registro Manual de Atención</h2>
        <p className="walkin-subtitle">
          Agrega una atención que ya ocurrió y no fue registrada en su momento.
          Se guardará como <strong>Completada</strong>.
        </p>
      </div>

      <div className="walkin-card">
        <form onSubmit={handleSubmit} className="walkin-form">

          {/* Cliente */}
          <div className="walkin-field">
            <label>Cliente</label>
            <ClientsSearchSelect
              clients={activeClients}
              value={form.client}
              onChange={(id) => setForm((prev) => ({ ...prev, client: id }))}
              onAddNew={() => setShowClientModal(true)}
              error={!!errors.client}
              id="walkin-client"
              name="client"
            />
            {errors.client && <span className="walkin-error">{errors.client}</span>}
          </div>

          {/* Servicio */}
          <div className="walkin-field">
            <label>Servicio</label>
            <ServiceSearchSelect
              services={availableServices.length > 0 ? availableServices : services.filter((s) => s.is_active)}
              value={form.service}
              onChange={handleServiceChange}
              error={!!errors.service}
              id="walkin-service"
              name="service"
              placeholder="Seleccione un servicio..."
            />
            {errors.service && <span className="walkin-error">{errors.service}</span>}
            {selectedService && (
              <span className="walkin-service-hint">
                Duración: {selectedService.duration} min · Precio: ${selectedService.price}
              </span>
            )}
          </div>

          {/* Trabajador/a */}
          <div className="walkin-field">
            <label>Trabajador/a</label>
            <EmployeeSearchSelect
              employees={activeEmployees}
              value={form.employee}
              onChange={(id) => setForm((prev) => ({ ...prev, employee: id }))}
              error={!!errors.employee}
              id="walkin-employee"
              name="employee"
              placeholder="Seleccione un trabajador/a..."
            />
            {errors.employee && <span className="walkin-error">{errors.employee}</span>}
          </div>

          {/* Fecha y hora en fila */}
          <div className="walkin-row">
            <div className="walkin-field">
              <label>Fecha</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                className={`walkin-input${errors.date ? " walkin-input-error" : ""}`}
              />
              {errors.date && <span className="walkin-error">{errors.date}</span>}
            </div>

            <div className="walkin-field">
              <label>Hora de inicio</label>
              <input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
                className={`walkin-input${errors.start_time ? " walkin-input-error" : ""}`}
              />
              {errors.start_time && <span className="walkin-error">{errors.start_time}</span>}
            </div>

            <div className="walkin-field">
              <label>Hora de fin</label>
              <input
                type="time"
                value={form.end_time}
                readOnly={!!selectedService}
                onChange={(e) => {
                  if (!selectedService) setForm((prev) => ({ ...prev, end_time: e.target.value }));
                }}
                className={`walkin-input${errors.end_time ? " walkin-input-error" : ""}${selectedService ? " walkin-input-readonly" : ""}`}
              />
              {selectedService && (
                <span className="walkin-service-hint">Calculado según duración del servicio</span>
              )}
              {errors.end_time && <span className="walkin-error">{errors.end_time}</span>}
            </div>
          </div>

          {/* Notas */}
          <div className="walkin-field">
            <label>Notas (opcional)</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              className="walkin-input walkin-textarea"
              rows={3}
              placeholder="Observaciones adicionales..."
            />
          </div>

          {/* Acciones */}
          <div className="walkin-actions">
            <button
              type="button"
              className="walkin-btn-secondary"
              onClick={() => { setForm(emptyForm()); setSelectedService(null); setErrors({}); }}
            >
              Limpiar
            </button>
            <button type="submit" className="walkin-btn-primary" disabled={submitting}>
              {submitting ? "Guardando..." : "Guardar registro"}
            </button>
          </div>

        </form>
      </div>

      {showClientModal && (
        <ClientFormModal
          client={null}
          onClose={() => setShowClientModal(false)}
          onSave={handleCreateClient}
        />
      )}
    </div>
  );
};

export default WalkInPage;
