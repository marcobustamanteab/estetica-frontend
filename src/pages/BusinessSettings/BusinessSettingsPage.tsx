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
  primary_color: string;
  employee_label: string;
  booking_tagline: string;
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
  const { selectedBusiness, businesses, setSelectedBusiness, refreshBusiness } = useBusinessContext();
  const isSuperAdmin = (currentUser as any)?.is_superuser === true;

  const [form, setForm] = useState<BusinessData>({
    id: 0, name: '', slug: '', logo_url: '', working_days: [],
    primary_color: '#0d9488', employee_label: 'Especialista', booking_tagline: 'Elige tu servicio y agenda en minutos',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [logoError, setLogoError] = useState<string>('');

  const authHeader = () => ({ Authorization: `Bearer ${localStorage.getItem('access')}`, 'Content-Type': 'application/json' });

  const fetchBusiness = async (pk?: number) => {
    setLoading(true);
    try {
      const url = pk
        ? `${API_BASE_URL}/api/auth/businesses/${pk}/`
        : `${API_BASE_URL}/api/auth/businesses/me/`;
      const res = await fetch(url, { headers: authHeader() });
      const data = await res.json();
      setForm({
        ...data,
        logo_url: data.logo_url || '',
        working_days: data.working_days || [],
        primary_color: data.primary_color || '#0d9488',
        employee_label: data.employee_label || 'Especialista',
        booking_tagline: data.booking_tagline || 'Elige tu servicio y agenda en minutos',
      });
      setLogoFile(null);
      setLogoPreview('');
    } catch {
      toast.error('Error al cargar los datos del negocio');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      setLogoError('Formato no permitido. Solo JPG, PNG, WebP o GIF.');
      e.target.value = '';
      return;
    }
    const maxMB = 2;
    if (file.size > maxMB * 1024 * 1024) {
      setLogoError(`El archivo supera el límite de ${maxMB} MB (tamaño actual: ${(file.size / 1024 / 1024).toFixed(1)} MB).`);
      e.target.value = '';
      return;
    }
    setLogoError('');
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
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

      const body = new FormData();
      body.append('name', form.name);
      body.append('working_days', JSON.stringify(form.working_days));
      body.append('primary_color', form.primary_color || '#0d9488');
      body.append('employee_label', form.employee_label || 'Especialista');
      body.append('booking_tagline', form.booking_tagline || '');
      if (logoFile) body.append('logo_file', logoFile);

      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al guardar');
      }
      const updated = await res.json();
      setForm((prev) => ({ ...prev, slug: updated.slug, logo_url: updated.logo_url || prev.logo_url }));
      setLogoFile(null);
      setLogoPreview('');
      toast.success('Configuración guardada correctamente');
      await refreshBusiness();
    } catch (e: any) {
      toast.error(e.message || 'Error al guardar los cambios');
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
            <label className="bs-label">Logo del negocio</label>
            <p className="bs-hint">JPG, PNG o WebP · máximo 2 MB</p>
            <div className="bs-logo-row">
              {(logoPreview || form.logo_url) && (
                <img
                  src={logoPreview || form.logo_url}
                  alt="Logo"
                  className="bs-logo-preview"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <label className="bs-file-label">
                {logoFile ? logoFile.name : 'Seleccionar imagen'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="bs-file-input"
                  onChange={handleLogoChange}
                />
              </label>
              {logoFile && (
                <button type="button" className="bs-remove-logo" onClick={() => { setLogoFile(null); setLogoPreview(''); setLogoError(''); }}>
                  Quitar
                </button>
              )}
            </div>
            {logoError && <p className="bs-logo-error">{logoError}</p>}
          </div>

          {/* Color primario */}
          <div className="bs-section">
            <label className="bs-label">Color del sitio de reservas</label>
            <p className="bs-hint">Define el color principal que verán tus clientes al agendar.</p>
            <div className="bs-color-row">
              <input
                type="color"
                className="bs-color-picker"
                value={form.primary_color}
                onChange={(e) => setForm((p) => ({ ...p, primary_color: e.target.value }))}
              />
              <input
                type="text"
                className="bs-input bs-color-hex"
                value={form.primary_color}
                maxLength={7}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) setForm((p) => ({ ...p, primary_color: val }));
                }}
                placeholder="#0d9488"
              />
              <div className="bs-color-preview" style={{ background: form.primary_color }} />
            </div>
          </div>

          {/* Tagline de booking */}
          <div className="bs-section">
            <label className="bs-label">Frase del sitio de reservas</label>
            <p className="bs-hint">Texto corto que aparece debajo del título "Reserva tu cita".</p>
            <input
              type="text"
              className="bs-input"
              value={form.booking_tagline}
              onChange={(e) => setForm((p) => ({ ...p, booking_tagline: e.target.value }))}
              placeholder="Elige tu servicio y agenda en minutos"
              maxLength={120}
            />
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
