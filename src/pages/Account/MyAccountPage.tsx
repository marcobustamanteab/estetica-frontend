/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { Mail, Lock, User, Shield, Percent, Eye, EyeOff, CheckCircle2, Building2, Camera } from 'lucide-react';
import { toast } from 'react-toastify';
import './myAccount.css';

const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
  : 'http://localhost:8000';

const AVATAR_COLORS = [
  '#0d9488', '#0891b2', '#7c3aed', '#dc2626',
  '#ea580c', '#65a30d', '#c026d3', '#2563eb',
  '#059669', '#7c2d12',
];

function getInitials(first: string, last: string) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || 'U';
}
function getAvatarColor(initials: string) {
  const code = initials.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

const MyAccountPage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Solo se permiten imágenes JPG, PNG o WebP.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(`La imagen supera 2 MB (${(file.size/1024/1024).toFixed(1)} MB).`);
      return;
    }
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('profile_image', file);
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al subir imagen');
      }
      await refreshUser();
      setImgError(false);
      toast.success('Foto actualizada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [newEmail, setNewEmail]       = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew]                 = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [savingPassword, setSavingPassword]   = useState(false);

  const getAllRoles = (): string[] => {
    const groups = (currentUser as any)?.groups;
    if (!groups || groups.length === 0) return [];
    return groups.map((g: any) =>
      typeof g === 'object' && g !== null && 'name' in g ? g.name : `Rol ${g}`
    );
  };

  const roles          = getAllRoles();
  const initials       = getInitials(currentUser?.first_name || '', currentUser?.last_name || '');
  const avatarBg       = getAvatarColor(initials);
  const commissionRate = (currentUser as any)?.commission_rate;
  const isActive       = (currentUser as any)?.is_active !== false;

  const rawImage = (currentUser as any)?.profile_image;
  const profileImageUrl = rawImage
    ? (rawImage.startsWith('http') ? rawImage : `${API_BASE_URL}${rawImage}`)
    : null;

  const handleSaveEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSavingEmail(true);
    try {
      await authService.updateProfile({ email: newEmail.trim() } as any);
      toast.success('Correo actualizado correctamente');
      setNewEmail('');
    } catch {
      toast.error('Error al actualizar el correo');
    } finally { setSavingEmail(false); }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Las contraseñas no coinciden'); return; }
    if (newPassword.length < 6)          { toast.error('Mínimo 6 caracteres'); return; }
    setSavingPassword(true);
    try {
      await authService.updateProfile({ password: newPassword } as any);
      toast.success('Contraseña actualizada correctamente');
      setNewPassword(''); setConfirmPassword('');
    } catch {
      toast.error('Error al actualizar la contraseña');
    } finally { setSavingPassword(false); }
  };

  return (
    <div className="buk-page">

      {/* ── FILA SUPERIOR: Hero (col 5) + Info personal (col 7) ── */}
      <div className="buk-top-row">

        {/* Card izquierda: Banner + foto + nombre + chips */}
        <div className="buk-hero-card">
          <div className="buk-banner-bg" />

          <div className="buk-avatar-wrap">
            {profileImageUrl && !imgError ? (
              <img
                src={profileImageUrl}
                alt={currentUser?.first_name || 'Perfil'}
                className="buk-avatar-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="buk-avatar-initials" style={{ background: avatarBg }}>
                {initials}
              </div>
            )}
            <button
              className="buk-avatar-camera"
              title="Cambiar foto"
              disabled={uploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadingPhoto ? '…' : <Camera size={15} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              style={{ display: 'none' }}
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="buk-hero-body">
            <div className="buk-name">
              {currentUser?.first_name} {currentUser?.last_name}
            </div>
            <div className="buk-chips">
              {roles.length > 0
                ? roles.map((r, i) => <span key={i} className="buk-chip">{r}</span>)
                : <span className="buk-chip">Sin rol</span>}
              <span className={`buk-chip-status ${isActive ? 'active' : 'inactive'}`}>
                <CheckCircle2 size={12} />
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Card derecha: Información personal */}
        <div className="buk-card">
          <div className="buk-card-title">
            <User size={15} />
            Información personal
          </div>

          <div className="buk-info-grid">
            <div className="buk-info-item">
              <span className="buk-info-label"><User size={12} /> Usuario</span>
              <span className="buk-info-value">{currentUser?.username || '—'}</span>
            </div>

            <div className="buk-info-item">
              <span className="buk-info-label"><Mail size={12} /> Correo</span>
              <span className="buk-info-value">{currentUser?.email || '—'}</span>
            </div>

            <div className="buk-info-item">
              <span className="buk-info-label"><Shield size={12} /> Tipo de cuenta</span>
              <span className="buk-info-value">Trabajador</span>
            </div>

            {commissionRate != null && (
              <div className="buk-info-item">
                <span className="buk-info-label"><Percent size={12} /> Comisión</span>
                <span className="buk-info-value">{commissionRate}%</span>
              </div>
            )}

            <div className="buk-info-item">
              <span className="buk-info-label"><Building2 size={12} /> Área</span>
              <span className="buk-info-value">
                {roles.length > 0 ? roles.join(' · ') : 'Sin asignar'}
              </span>
            </div>

            <div className="buk-info-item">
              <span className="buk-info-label"><CheckCircle2 size={12} /> Estado</span>
              <span className={`buk-info-value status-val ${isActive ? 'active' : 'inactive'}`}>
                {isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── FILA INFERIOR: Seguridad (ancho completo) ── */}
      <div className="buk-card">
        <div className="buk-card-title">
          <Lock size={15} />
          Seguridad de la cuenta
        </div>

        <div className="buk-security-grid">
          {/* Correo */}
          <div className="buk-security-block">
            <div className="buk-security-block-title">
              <Mail size={15} />
              Cambiar correo
            </div>
            <p className="buk-security-hint">
              Actual: <strong>{currentUser?.email}</strong>
            </p>
            <form onSubmit={handleSaveEmail}>
              <div className="buk-field">
                <label htmlFor="newEmail">Nuevo correo</label>
                <input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="nuevo@correo.com"
                  required
                />
              </div>
              <button type="submit" className="buk-btn" disabled={savingEmail}>
                {savingEmail ? 'Guardando…' : 'Actualizar correo'}
              </button>
            </form>
          </div>

          {/* Contraseña */}
          <div className="buk-security-block">
            <div className="buk-security-block-title">
              <Lock size={15} />
              Cambiar contraseña
            </div>
            <p className="buk-security-hint">Mínimo 6 caracteres.</p>
            <form onSubmit={handleSavePassword}>
              <div className="buk-field">
                <label htmlFor="newPw">Nueva contraseña</label>
                <div className="buk-pw-wrap">
                  <input
                    id="newPw"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" className="buk-pw-eye" onClick={() => setShowNew(v => !v)} tabIndex={-1}>
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="buk-field">
                <label htmlFor="confirmPw">Confirmar contraseña</label>
                <div className="buk-pw-wrap">
                  <input
                    id="confirmPw"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" className="buk-pw-eye" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="buk-btn" disabled={savingPassword}>
                {savingPassword ? 'Guardando…' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>

    </div>
  );
};

export default MyAccountPage;
