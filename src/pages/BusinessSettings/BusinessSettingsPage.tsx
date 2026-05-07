/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
import { toast } from 'react-toastify';
import './businessSettings.css';

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app'
  : 'http://localhost:8000';

const DAYS = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

interface BusinessData {
  id: number;
  name: string;
  slug: string;
  logo_url: string;
  working_days: number[];
}

const BookingURL: React.FC<{ slug: string }> = ({ slug }) => {
  const [copied, setCopied] = useState(false);
  const bookingUrl = `${window.location.origin}/booking/${slug}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bs-booking-url">
      <span className="bs-url-text">{bookingUrl}</span>
      <button type="button" className="bs-copy-btn" onClick={handleCopy}>
        {copied ? '✓ Copiado' : 'Copiar'}
      </button>
    </div>
  );
};

const BusinessSettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedBusiness, businesses, setSelectedBusiness } = useBusinessContext();
  const isSuperAdmin = (currentUser as any)?.is_superuser === true;

  const [form, setForm] = useState<BusinessData>({ id: 0, name: '', slug: '', logo_url: '', working_days: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('access')}`, 'Content-Type': 'application/json' });

  const fetchBusiness = async (pk?: number) => {
    setLoading(true);
    try {
      const url = pk
        ? `${API_BASE_URL}/api/auth/businesses/${pk}/`
        : `${API_BASE_URL}/api/auth/businesses/me/`;
      const res = await fetch(url, { headers: authHeader() });
      const data = await res.json();
      setForm({ ...data, logo_url: data.logo_url || '', working_days: data.working_days || [] });
    } catch {
      toast.error('Error al cargar los datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos cuando cambia el negocio seleccionado
  useEffect(() => {
    if (isSuperAdmin && selectedBusiness) {
      fetchBusiness(selectedBusiness);
    } else if (!isSuperAdmin) {
      fetchBusiness();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBusiness, isSuperAdmin]);

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      working_days: prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day].sort((a, b) => a - b),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    setSaving(true);
    try {
      const url = isSuperAdmin && form.id
        ? `${API_BASE_URL}/api/auth/businesses/${form.id}/`
        : `${API_BASE_URL}/api/auth/businesses/me/`;
      const res = await fetch(url, {
        method: 'PATCH',
        headers: authHeader(),
        body: JSON.stringify({ name: form.name, logo_url: form.logo_url || null, working_days: form.working_days }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setForm((prev) => ({ ...prev, slug: updated.slug }));
      toast.success('Configuración guardada correctamente');
    } catch {
      toast.error('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="bs-page"><p className="bs-loading">Cargando...</p></div>;

  return (
    <div className="bs-page">
      <div className="bs-header">
        <h2>Configuración del Negocio</h2>
        <p className="bs-subtitle">Edita el nombre, logo y días de atención de tu negocio.</p>
      </div>

      {/* Selector de negocio — solo superadmin */}
      {isSuperAdmin && businesses.length > 0 && (
        <div className="bs-section">
          <label className="bs-label">Negocio</label>
          <div className="bs-business-list">
            {businesses.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`bs-business-btn${selectedBusiness === b.id ? ' active' : ''}`}
                onClick={() => setSelectedBusiness(b.id)}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {form.id > 0 && (
        <div className="bs-card">

          {/* Nombre */}
          <div className="bs-section">
            <label className="bs-label">Nombre del negocio</label>
            <input
              type="text"
              className="bs-input"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Nombre de tu negocio"
            />
          </div>

          {/* Logo */}
          <div className="bs-section">
            <label className="bs-label">URL del logo</label>
            <div className="bs-logo-row">
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="bs-logo-preview" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              <input
                type="url"
                className="bs-input"
                value={form.logo_url}
                onChange={(e) => setForm((p) => ({ ...p, logo_url: e.target.value }))}
                placeholder="https://ejemplo.com/logo.png"
              />
            </div>
          </div>

          {/* Días hábiles */}
          <div className="bs-section">
            <label className="bs-label">Días de atención</label>
            <p className="bs-hint">Estos días aparecerán disponibles en la página de reservas pública.</p>
            <div className="bs-days">
              {DAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  className={`bs-day-btn${form.working_days.includes(d.value) ? ' active' : ''}`}
                  onClick={() => toggleDay(d.value)}
                >
                  {d.label.slice(0, 3)}
                </button>
              ))}
            </div>
          </div>

          {/* Link de booking */}
          {form.slug && (
            <div className="bs-section">
              <label className="bs-label">Link de reservas públicas</label>
              <BookingURL slug={form.slug} />
            </div>
          )}

          {/* Acciones */}
          <div className="bs-actions">
            <button type="button" className="bs-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessSettingsPage;
