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
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#0d9488" }}>‹</button>
        <span style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 15 }}>{MONTHS[month]} {year}</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#0d9488" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 600, padding: "4px 0" }}>{d}</div>
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
                border: "none", borderRadius: 8, padding: "7px 0",
                cursor: isPast ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: isSelected ? 700 : 400,
                background: isSelected ? "#0d9488" : isToday ? "#f0fdfa" : "none",
                color: isSelected ? "white" : isPast ? "#d1d5db" : isToday ? "#0d9488" : "#374151",
                transition: "all 0.15s",
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
  const steps = ["Servicio", "Especialista", "Fecha & Hora", "Tus datos"];

  const serviceIcons: Record<string, string> = {
    default: "✂️", manicure: "💅", pedicure: "🦶", tinte: "🎨", maquillaje: "💄", tratamiento: "💆", corte: "✂️", barba: "🪒",
  };
  const getIcon = (name: string) => {
    const lower = name.toLowerCase();
    for (const key of Object.keys(serviceIcons)) {
      if (lower.includes(key)) return serviceIcons[key];
    }
    return serviceIcons.default;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 48, height: 48, border: "3px solid #0d9488", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "#0d9488", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>Cargando...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
        <h2 style={{ color: "#1a1a2e", marginBottom: 8 }}>Negocio no encontrado</h2>
        <p style={{ color: "#6b7280" }}>El enlace que seguiste no corresponde a ningún negocio activo.</p>
      </div>
    </div>
  );

  if (confirmed) return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif", padding: 20 }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />
      <div style={{ background: "white", borderRadius: 24, padding: "48px 40px", textAlign: "center", maxWidth: 480, width: "100%", boxShadow: "0 20px 60px rgba(13,148,136,0.12)" }}>
        <div style={{ width: 72, height: 72, background: "linear-gradient(135deg, #0d9488, #14b8a6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32, color: "white", fontWeight: 700 }}>✓</div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#1a1a2e", margin: "0 0 12px" }}>¡Cita confirmada!</h2>
        <p style={{ color: "#6b7280", marginBottom: 28, lineHeight: 1.6 }}>
          Te enviamos un correo de confirmación a <strong>{form.email}</strong>. ¡Te esperamos!
        </p>
        <div style={{ background: "#f0fdfa", borderRadius: 14, padding: "18px 20px", textAlign: "left", marginBottom: 28 }}>
          {[
            ["💅 Servicio", selectedService?.name],
            ["👩‍💼 Especialista", `${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`],
            ["📅 Fecha", date],
            ["🕐 Hora", time],
            ["💰 Total", formatPrice(selectedService?.price || 0)],
          ].map(([label, val]) => (
            <div key={label as string} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #e0f2fe" }}>
              <span style={{ color: "#6b7280", fontSize: 14 }}>{label}</span>
              <span style={{ fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>{val}</span>
            </div>
          ))}
        </div>
        <button
          onClick={() => { setStep(1); setService(null); setEmployee(null); setDate(""); setTime(""); setForm({ name: "", email: "", phone: "", notes: "" }); setConfirmed(false); }}
          style={{ background: "linear-gradient(135deg, #0d9488, #14b8a6)", color: "white", border: "none", borderRadius: 12, padding: "13px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}
        >
          Agendar otra cita
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)", fontFamily: "'DM Sans', sans-serif", padding: "20px 16px 40px" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28, paddingTop: 16 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", borderRadius: 50, padding: "8px 20px", boxShadow: "0 4px 16px rgba(13,148,136,0.1)", marginBottom: 16 }}>
          <div style={{ width: 30, height: 30, background: "linear-gradient(135deg, #0d9488, #14b8a6)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✂</div>
          <span style={{ fontWeight: 700, color: "#0d9488", fontSize: 14 }}>{business?.name}</span>
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#1a1a2e", margin: "0 0 6px" }}>Reserva tu cita</h1>
        <p style={{ color: "#6b7280", margin: 0, fontSize: 14 }}>Elige tu servicio y agenda en minutos</p>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 28 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, opacity: i + 1 > step ? 0.35 : 1, transition: "opacity 0.3s" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: i + 1 < step ? "#0d9488" : i + 1 === step ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "white",
                border: i + 1 <= step ? "none" : "2px solid #d1d5db",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700,
                color: i + 1 <= step ? "white" : "#9ca3af",
                boxShadow: i + 1 === step ? "0 4px 12px rgba(13,148,136,0.3)" : "none",
              }}>{i + 1 < step ? "✓" : i + 1}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: i + 1 === step ? "#0d9488" : "#9ca3af" }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width: 20, height: 2, background: i + 1 < step ? "#0d9488" : "#e5e7eb", borderRadius: 2 }} />}
          </div>
        ))}
      </div>

      {/* Card */}
      <div style={{ maxWidth: 580, margin: "0 auto", background: "white", borderRadius: 24, boxShadow: "0 20px 60px rgba(13,148,136,0.1)", overflow: "hidden" }}>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1a1a2e", margin: "0 0 4px" }}>¿Qué servicio necesitas?</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>Selecciona el servicio que deseas reservar</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {business?.services.map(s => (
                <button key={s.id} onClick={() => setService(s.id)} style={{
                  border: service === s.id ? "2px solid #0d9488" : "2px solid #f3f4f6",
                  borderRadius: 14, padding: "14px 12px", cursor: "pointer",
                  background: service === s.id ? "#f0fdfa" : "white", textAlign: "left",
                  transition: "all 0.2s", boxShadow: service === s.id ? "0 4px 16px rgba(13,148,136,0.15)" : "none",
                }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{getIcon(s.name)}</div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", marginBottom: 3 }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{s.duration} min</div>
                  <div style={{ fontWeight: 700, color: "#0d9488", fontSize: 13 }}>{formatPrice(s.price)}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1a1a2e", margin: "0 0 4px" }}>Elige tu especialista</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>¿Con quién te gustaría atenderte?</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {business?.employees.map(e => (
                <button key={e.id} onClick={() => setEmployee(e.id)} style={{
                  border: employee === e.id ? "2px solid #0d9488" : "2px solid #f3f4f6",
                  borderRadius: 14, padding: "14px 18px", cursor: "pointer",
                  background: employee === e.id ? "#f0fdfa" : "white",
                  display: "flex", alignItems: "center", gap: 14,
                  transition: "all 0.2s", boxShadow: employee === e.id ? "0 4px 16px rgba(13,148,136,0.15)" : "none",
                }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "linear-gradient(135deg, #0d9488, #14b8a6)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {e.first_name[0]}{e.last_name[0]}
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 600, color: "#1a1a2e", fontSize: 14 }}>{e.first_name} {e.last_name}</div>
                    <div style={{ color: "#9ca3af", fontSize: 12 }}>Especialista</div>
                  </div>
                  {employee === e.id && <div style={{ marginLeft: "auto", color: "#0d9488", fontSize: 18, fontWeight: 700 }}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1a1a2e", margin: "0 0 4px" }}>¿Cuándo te acomoda?</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>Selecciona fecha y horario disponible</p>
            <MiniCalendar selected={date} onSelect={setDate} />
            {date && (
              <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: "#1a1a2e", marginBottom: 10 }}>Horarios disponibles</div>
                {loadingTimes ? (
                  <p style={{ color: "#9ca3af", fontSize: 13 }}>Cargando horarios...</p>
                ) : availableTimes.length === 0 ? (
                  <p style={{ color: "#ef4444", fontSize: 13 }}>No hay horarios disponibles para esta fecha.</p>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    {availableTimes.map(t => (
                      <button key={t} onClick={() => setTime(t)} style={{
                        border: time === t ? "2px solid #0d9488" : "2px solid #f3f4f6",
                        borderRadius: 10, padding: "9px 4px", cursor: "pointer",
                        background: time === t ? "#0d9488" : "white",
                        color: time === t ? "white" : "#374151",
                        fontWeight: 600, fontSize: 12, transition: "all 0.15s",
                      }}>{t}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4 */}
        {step === 4 && (
          <div style={{ padding: 28 }}>
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#1a1a2e", margin: "0 0 4px" }}>Tus datos</h3>
            <p style={{ color: "#9ca3af", fontSize: 13, margin: "0 0 20px" }}>Casi listo — cuéntanos cómo contactarte</p>
            <div style={{ background: "#f0fdfa", borderRadius: 12, padding: "12px 16px", marginBottom: 20, display: "flex", flexWrap: "wrap", gap: 14 }}>
              {[["Servicio", selectedService?.name], ["Especialista", `${selectedEmployee?.first_name} ${selectedEmployee?.last_name}`], ["Fecha", date], ["Hora", time]].map(([label, val]) => (
                <div key={label as string}>
                  <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0d9488" }}>{val}</div>
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
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    style={{ width: "100%", boxSizing: "border-box", border: "2px solid #f3f4f6", borderRadius: 10, padding: "11px 14px", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                    onFocus={e => e.target.style.borderColor = "#0d9488"}
                    onBlur={e => e.target.style.borderColor = "#f3f4f6"}
                  />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>Notas (opcional)</label>
                <textarea
                  placeholder="¿Algo que debamos saber?"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  style={{ width: "100%", boxSizing: "border-box", border: "2px solid #f3f4f6", borderRadius: 10, padding: "11px 14px", fontSize: 14, resize: "none", outline: "none", fontFamily: "'DM Sans', sans-serif" }}
                  onFocus={e => e.target.style.borderColor = "#0d9488"}
                  onBlur={e => e.target.style.borderColor = "#f3f4f6"}
                />
              </div>
              {error && <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "18px 28px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", gap: 10 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s - 1)} style={{ border: "2px solid #f3f4f6", borderRadius: 10, padding: "11px 22px", fontSize: 13, fontWeight: 600, background: "white", color: "#6b7280", cursor: "pointer" }}>
              ← Atrás
            </button>
          )}
          <button
            onClick={step === 4 ? handleConfirm : () => setStep(s => s + 1)}
            disabled={!canNext() || submitting}
            style={{
              marginLeft: "auto",
              background: canNext() && !submitting ? "linear-gradient(135deg, #0d9488, #14b8a6)" : "#f3f4f6",
              color: canNext() && !submitting ? "white" : "#9ca3af",
              border: "none", borderRadius: 10, padding: "11px 24px",
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

      <p style={{ textAlign: "center", color: "#9ca3af", fontSize: 11, marginTop: 20 }}>
        Powered by <strong style={{ color: "#0d9488" }}>BeautyCare</strong>
      </p>
    </div>
  );
}