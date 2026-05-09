import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import './subHeader.css';

interface NextAppt {
  date: string;
  start_time: string;
  client_name: string;
  service_name: string;
}

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app'
  : 'http://localhost:8000';

const SubHeader: React.FC = () => {
  const [now, setNow] = useState(() => new Date());
  const [nextAppt, setNextAppt] = useState<NextAppt | null>(null);
  const [noAppts, setNoAppts] = useState(false);
  const nextApptRef = useRef<NextAppt | null>(null);

  // ── Reloj — tick cada segundo ────────────────────────────────────────────
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // ── Fetch próxima cita ───────────────────────────────────────────────────
  const fetchNext = useCallback(async () => {
    const token = localStorage.getItem('access');
    if (!token) return;

    const today = format(new Date(), 'yyyy-MM-dd');
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/appointments/?date_from=${today}&date_to=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return;

      const appts: NextAppt[] = await res.json();
      const nowTime = format(new Date(), 'HH:mm:ss');

      const upcoming = appts
        .filter((a: any) =>
          (a.status === 'pending' || a.status === 'confirmed') &&
          a.start_time > nowTime
        )
        .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));

      const found = (upcoming[0] as NextAppt) || null;
      nextApptRef.current = found;
      setNextAppt(found);
      setNoAppts(upcoming.length === 0);
    } catch {
      // falla silenciosa
    }
  }, []);

  useEffect(() => {
    fetchNext();
    // re-fetch cada 2 minutos para mantenerse actualizado
    const interval = setInterval(fetchNext, 120_000);
    return () => clearInterval(interval);
  }, [fetchNext]);

  // Cuando el countdown llega a 0 re-fetch para obtener la siguiente
  useEffect(() => {
    if (!nextAppt) return;
    const apptTime = new Date(`${nextAppt.date}T${nextAppt.start_time}`);
    const diff = apptTime.getTime() - now.getTime();
    if (diff <= 0) fetchNext();
  }, [now, nextAppt, fetchNext]);

  // ── Cálculo del countdown ────────────────────────────────────────────────
  const getCountdown = (): string => {
    if (!nextAppt) return '';
    const apptTime = new Date(`${nextAppt.date}T${nextAppt.start_time}`);
    const diff = apptTime.getTime() - now.getTime();
    if (diff <= 0) return '¡Ahora!';
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const countdown = getCountdown();
  const isNow = countdown === '¡Ahora!';

  return (
    <div className="sub-header">
      {/* Reloj + fecha */}
      <div className="sub-header-left">
        <span className="sub-header-clock">{format(now, 'HH:mm:ss')}</span>
        <span className="sub-header-date">
          {format(now, "EEEE d 'de' MMMM", { locale: es })}
        </span>
      </div>

      {/* Countdown próxima cita */}
      <div className="sub-header-right">
        {nextAppt ? (
          <>
            <span className="sub-header-label">Siguiente cita en</span>
            <span className={`sub-header-countdown${isNow ? ' sub-header-now' : ''}`}>
              {countdown}
            </span>
            <span className="sub-header-appt-info">
              {nextAppt.client_name} · {nextAppt.service_name}
            </span>
          </>
        ) : noAppts ? (
          <span className="sub-header-empty">Sin citas pendientes hoy</span>
        ) : null}
      </div>
    </div>
  );
};

export default SubHeader;
