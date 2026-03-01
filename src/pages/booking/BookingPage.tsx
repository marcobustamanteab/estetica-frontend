/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

function formatPrice(p: number) {
  return `$${p.toLocaleString("es-CL")}`;
}

function MiniCalendar({ selected, onSelect }: { selected: string; onSelect: (d: string) => void }) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#0d9488", padding: "4px 10px" }}>‹</button>
        <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#0d9488", padding: "4px 10px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#9ca3af", fontWeight: 600, padding: "3px 0" }}>{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          const isSelected = dateStr === selected;
          const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          return (
            <button
              key={i}
              disabled={isPast}
              onClick={() => onSelect(dateStr)}
              style={{
                border: "none", borderRadius: 8, padding: "8px 0",
                cursor: isPast ? "not-allowed" : "pointer",
                fontSize: 12, fontWeight: isSelected ? 700 : 400,
                background: isSelected ? "#0d9488" : isToday ? "#f0fdfa" : "none",
                color: isSelected ? "white" : isPast ? "#d1d5db" : isToday ? "#0d9488" : "#374151",
                transition: "all 0.15s",
                minWidth: 0,
              }}
            >{day}</button>
          );
        })}
      </div>
    </div>
  );
}

interface Service { id: number; name: string; duration: number; price: number; description: string; }
interface Employee { id: number; first_name: string; last_name: string; }
interface BusinessInfo { id: number; name: string; slug: string; services: Service[]; employees: Employee[]; }

export default function BookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [step, setStep] = useState(1);
  const [service, setService] = useState<number | null>(null);
  const [employee, setEmployee] = useState<number | null>(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get<BusinessInfo>(`${API_URL}/api/appointments/public/${slug}/`)
      .then(res => { setBusiness(res.data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    if (!date || !employee || !slug) return;
    setLoadingTimes(true);
    setTime("");
    axios.get<{ available_times: string[] }>(`${API_URL}/api/appointments/public/${slug}/times/`, {
      params: { date, employee_id: employee }
    })
      .then(res => { setAvailableTimes(res.data.available_times || []); setLoadingTimes(false); })
      .catch(() => { setAvailableTimes([]); setLoadingTimes(false); });
  }, [date, employee, slug]);

  const canNext = () => {
    if (step === 1) return !!service;
    if (step === 2) return !!employee;
    if (step === 3) return !!date && !!time;
    if (step === 4) return !!(form.name && form.email && form.phone);
    return false;
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${API_URL}/api/appointments/public/${slug}/book/`, {
        service_id: service,
        employee_id: employee,
        date,
        start_time: time,
        client_name: form.name,
        client_email: form.email,
        client_phone: form.phone,
        notes: form.notes,
      });
      setConfirmed(true);
    } catch (e: any) {
      setError(e.response?.data?.error || "Ocurrió un error al agendar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedService = business?.services.find(s => s.id === service);
  const selectedEmployee = business?.employees.find(e => e.id === employee);
  const steps = ["Servicio", "Especialista", "Fecha", "Datos"];

  const serviceIcons: Record<string, string> = {
    manicure: "💅", pedicure: "🦶", tinte: "🎨", maquillaje: "💄",
    tratamiento: "💆", corte: "✂️", barba: "🪒", uña: "💅", default: "✨",
  };
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    for (const key of Object.keys(serviceIcons)) {
      if (lower.includes(key)) return serviceIcons[key];
    }
    return serviceIcons.default;
  };

  const css = `
    * { box-sizing: border-box; }
    .booking-wrap { min-height: 100vh; background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%); font-family: 'DM Sans', sans-serif; padding: 16px 12px 40px; }
    .booking-card { max-width: 580px; margin: 0 auto; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(13,148,136,0.1); overflow: hidden; }
    .card-body { padding: 24px 20px; }
    .card-footer { padding: 16px 20px; border-top: 1px solid #f3f4f6; display: flex; justify-content: space-between; gap: 10px; }
    .services-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .times-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .step-label { display: inline; }
    @media (max-width: 400px) {
      .booking-wrap { padding: 12px 8px 32px; }
      .card-body { padding: 18px 14px; }
      .card-footer { padding: 14px 14px; }
      .services-grid { grid-template-columns: 1fr; }
      .times-grid { grid-template-columns: repeat(3, 1fr); }
      .step-label { display: none; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    input, textarea { width: 100%; border: 2px solid #f3f4f6; border-radius: 10px; padding: 11px 14px; font-size: 14px; outline: none; font-family: 'DM Sans', sans-serif; transition: border 0.2s; }
    input:focus, textarea:focus { border-color: #0d9488; }
  `;

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)" }}>
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "3px solid #0d9488", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 14px" }} />
        <p style={{ color: "#0d9488", fontWeight: 600 }}>Cargando...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 56, marginBottom: 14 }}>🔍</div>
        <h2 style={{ color: "#1a1a2e", marginBottom: 8 }}>Negocio no encontrado</h2>
        <p style={{ color: "#6b7280" }}>El enlace no corresponde a ningún negocio activo.</p>
      </div>
    </div>
  );

  if (confirmed) return (
    <div className="booking-wrap">
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ maxWidth: 480, margin: "40px auto 0", background: "white", borderRadius: 20, padding: "40px 24px", textAlign: "center", boxShadow: "0 20px 60px rgba(13,148,136,0.12)" }}>
        <div style={{ width: 68, height: 68, background: "linear-gradient(135deg, #0d9488, #14b8a6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: 30, color: "white", fontWeight: 700 }}>✓</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#1a1a2e", margin: "0 0 10px" }}>¡Cita confirmada!</h2>
        <p style={{ color: "#6b7280", marginBottom: 24, lineHeight: 1.6, fontSize: 14 }}>
          Enviamos confirmación a <strong>{form.email}</strong>
        </p>
        <div style={{ background: "#f0fdfa", borderRadius: 12, padding: "16px", textAlign: "left", marginBottom: 24 }}>
          {[
            ["💅 Servicio", selectedService?.name],
            ["👩‍💼 Especialista", `${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`],
            ["📅 Fecha", date],
            ["🕐 Hora", time],
            ["💰 Total", formatPrice(selectedService?.price || 0)],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e0f2fe" }}>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e" }}>{val}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setStep(1); setService(null); setEmployee(null); setDate(""); setTime(""); setForm({ name: "", email: "", phone: "", notes: "" }); setConfirmed(false); }}
          style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "white", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}
        >Agendar otra cita</button>
      </div>
    </div>
  );

  return (
    <div className="booking-wrap">
      <style>{css}</style>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 20, paddingTop: 8 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", borderRadius: 50, padding: "6px 16px", boxShadow: "0 4px 16px rgba(13,148,136,0.1)", marginBottom: 14 }}>
          <div style={{ width: 28, height: 28, background: "linear-gradient(135deg, #0d9488, #14b8a6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✂</div>
          <span style={{ fontWeight: 700, color: "#0d9488", fontSize: 13 }}>{business?.name}</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#1a1a2e", margin: "0 0 4px" }}>Reserva tu cita</h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: 13 }}>Elige tu servicio y agenda en minutos</p>
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 4, marginBottom: 20 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: i + 1 > step ? 0.35 : 1, transition: "opacity 0.3s" }}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%",
                background: i + 1 < step ? "#0d9488" : i + 1 === step ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "white",
                border: i + 1 <= step ? "none" : "2px solid #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                color: i + 1 <= step ? "white" : "#9ca3af",
                boxShadow: i + 1 === step ? "0 4px 12px rgba(13,148,136,0.3)" : "none",
                flexShrink: 0,
              }}>{i + 1 < step ? "✓" : i + 1}</div>
              <span className="step-label" style={{ fontSize: 10, fontWeight: 600, color: i + 1 === step ? "#0d9488" : "#9ca3af" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 16, height: 2, background: i + 1 < step ? "#0d9488" : "#e5e7eb", borderRadius: 2, flexShrink: 0 }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="booking-card">

        {/* Step 1 - Servicio */}
        {step === 1 && (
          <div className="card-body">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: "#1a1a2e", margin: "0 0 4px" }}>¿Qué servicio necesitas?</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 16px" }}>Selecciona el servicio que deseas</p>
            <div className="services-grid">
              {business?.services.map(s => (
                <button key={s.id} onClick={() => setService(s.id)} style={{
                  border: service === s.id ? "2px solid #0d9488" : "2px solid #f3f4f6",
                  borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                  background: service === s.id ? "#f0fdfa" : "white", textAlign: "left",
                  transition: "all 0.2s", boxShadow: service === s.id ? "0 4px 16px rgba(13,148,136,0.15)" : "none",
                  width: "100%",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{getIcon(s.name)}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", marginBottom: 2 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{s.duration} min</div>
                  <div style={{ fontWeight: 700, color: "#0d9488", fontSize: 13 }}>{formatPrice(s.price)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 - Empleado */}
        {step === 2 && (
          <div className="card-body">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: "#1a1a2e", margin: "0 0 4px" }}>Elige tu especialista</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 16px" }}>¿Con quién te gustaría atenderte?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {business?.employees.map(e => (
                <button key={e.id} onClick={() => setEmployee(e.id)} style={{
                  border: employee === e.id ? "2px solid #0d9488" : "2px solid #f3f4f6",
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                  background: employee === e.id ? "#f0fdfa" : "white",
                  display: "flex", alignItems: "center", gap: 12,
                  transition: "all 0.2s", boxShadow: employee === e.id ? "0 4px 16px rgba(13,148,136,0.15)" : "none",
                  width: "100%",
                }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                    {e.first_name[0]}{e.last_name[0]}
                  </div>
                  <div style={{ textAlign: "left", flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{e.first_name} {e.last_name}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>Especialista</div>
                  </div>
                  {employee === e.id && <div style={{ color: "#0d9488", fontSize: 18, fontWeight: 700 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 - Fecha y hora */}
        {step === 3 && (
          <div className="card-body">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: "#1a1a2e", margin: "0 0 4px" }}>¿Cuándo te acomoda?</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 16px" }}>Selecciona fecha y horario</p>
            <MiniCalendar selected={date} onSelect={setDate} />
            {date && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", marginBottom: 10 }}>Horarios disponibles</div>
                {loadingTimes ? (
                  <p style={{ color: "#9ca3af", fontSize: 13 }}>Cargando horarios...</p>
                ) : availableTimes.length === 0 ? (
                  <p style={{ color: "#ef4444", fontSize: 13 }}>No hay horarios disponibles para esta fecha.</p>
                ) : (
                  <div className="times-grid">
                    {availableTimes.map(t => (
                      <button key={t} onClick={() => setTime(t)} style={{
                        border: time === t ? "2px solid #0d9488" : "2px solid #f3f4f6",
                        borderRadius: 10, padding: "10px 4px", cursor: "pointer",
                        background: time === t ? "#0d9488" : "white",
                        color: time === t ? "white" : "#374151",
                        fontWeight: 600, fontSize: 13, transition: "all 0.15s",
                        width: "100%",
                      }}>{t}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 - Datos */}
        {step === 4 && (
          <div className="card-body">
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 19, color: "#1a1a2e", margin: "0 0 4px" }}>Tus datos</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 16px" }}>Casi listo — cuéntanos cómo contactarte</p>
            <div style={{ background: "#f0fdfa", borderRadius: 12, padding: "12px 14px", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {[
                ["Servicio", selectedService?.name],
                ["Especialista", `${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`],
                ["Fecha", date],
                ["Hora", time],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0d9488" }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { key: "name", label: "Nombre completo", placeholder: "Juan González", type: "text" },
                { key: "email", label: "Email", placeholder: "juan@email.com", type: "email" },
                { key: "phone", label: "Teléfono", placeholder: "+56 9 1234 5678", type: "tel" },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notas (opcional)</label>
                <textarea placeholder="¿Algo que debamos saber?" value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                  style={{ resize: "none" }} />
              </div>
              {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="card-footer">
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ border: "2px solid #f3f4f6", borderRadius: 10, padding: "11px 18px", fontSize: 13, fontWeight: 600, background: "white", color: "#6b7280", cursor: "pointer", flexShrink: 0 }}>
              ← Atrás
            </button>
          )}
          <button
            onClick={step === 4 ? handleConfirm : () => setStep(s => s + 1)}
            disabled={!canNext() || submitting}
            style={{
              marginLeft: "auto", flex: step === 1 ? 1 : "unset",
              background: canNext() && !submitting ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "#f3f4f6",
              color: canNext() && !submitting ? "white" : "#9ca3af",
              border: "none", borderRadius: 10, padding: "11px 22px",
              fontSize: 13, fontWeight: 700,
              cursor: canNext() && !submitting ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              boxShadow: canNext() && !submitting ? "0 4px 16px rgba(13,148,136,0.3)" : "none",
            }}
          >
            {submitting ? "Agendando..." : step === 4 ? "✓ Confirmar cita" : "Continuar →"}
          </button>
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 11, marginTop: 18 }}>
        Powered by <strong style={{ color: "#0d9488" }}>BeautyCare</strong>
      </p>
    </div>
  );
}