/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { Mail, Lock, User, Shield, Percent, Eye, EyeOff, CheckCircle } from 'lucide-react';
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
  const { currentUser } = useAuth();
  const [imgError, setImgError] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const getAllRoles = (): string[] => {
    const groups = (currentUser as any)?.groups;
    if (!groups || groups.length === 0) return [];
    return groups.map((g: any) =>
      typeof g === 'object' && g !== null && 'name' in g ? g.name : `Rol ${g}`
    );
  };

  const roles = getAllRoles();
  const initials = getInitials(currentUser?.first_name || '', currentUser?.last_name || '');
  const avatarBg = getAvatarColor(initials);
  const commissionRate = (currentUser as any)?.commission_rate;
  const isActive = (currentUser as any)?.is_active !== false;

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
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      await authService.updateProfile({ password: newPassword } as any);
      toast.success('Contraseña actualizada correctamente');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="mac-page">
      <h2 className="mac-title">Mi cuenta</h2>

      {/* ── Hero: foto + nombre + badges ── */}
      <div className="mac-hero">
        <div className="mac-photo-ring">
          {profileImageUrl && !imgError ? (
            <img
              src={profileImageUrl}
              alt={currentUser?.first_name || 'Perfil'}
              className="mac-photo-img"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="mac-photo-initials" style={{ background: avatarBg }}>
              {initials}
            </div>
          )}
          <span className={`mac-status-dot ${isActive ? 'active' : 'inactive'}`} />
        </div>

        <div className="mac-hero-body">
          <div className="mac-hero-name">
            {currentUser?.first_name} {currentUser?.last_name}
          </div>

          <div className="mac-badges">
            {roles.length > 0
              ? roles.map((r, i) => <span key={i} className="mac-badge">{r}</span>)
              : <span className="mac-badge">Sin rol asignado</span>
            }
          </div>

          <span className={`mac-active-label ${isActive ? 'active' : 'inactive'}`}>
            <CheckCircle size={13} />
            {isActive ? 'Activo' : 'Inactivo'}
          </span>
        </div>
      </div>

      {/* ── Grilla de información ── */}
      <div className="mac-info-grid">
        <div className="mac-info-cell">
          <div className="mac-info-icon"><User size={16} /></div>
          <div>
            <div className="mac-info-label">Usuario</div>
            <div className="mac-info-value">{currentUser?.username || '—'}</div>
          </div>
        </div>

        <div className="mac-info-cell">
          <div className="mac-info-icon"><Mail size={16} /></div>
          <div>
            <div className="mac-info-label">Correo electrónico</div>
            <div className="mac-info-value">{currentUser?.email || '—'}</div>
          </div>
        </div>

        <div className="mac-info-cell">
          <div className="mac-info-icon"><Shield size={16} /></div>
          <div>
            <div className="mac-info-label">Tipo de cuenta</div>
            <div className="mac-info-value">Trabajador</div>
          </div>
        </div>

        {commissionRate != null && (
          <div className="mac-info-cell">
            <div className="mac-info-icon"><Percent size={16} /></div>
            <div>
              <div className="mac-info-label">Comisión</div>
              <div className="mac-info-value">{commissionRate}%</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Seguridad ── */}
      <div className="mac-section-title">Seguridad de la cuenta</div>

      <div className="mac-settings-row">
        {/* Correo */}
        <div className="mac-settings-card">
          <div className="mac-settings-card-head">
            <Mail size={18} />
            <span>Correo electrónico</span>
          </div>
          <p className="mac-settings-hint">
            Correo actual: <strong>{currentUser?.email}</strong>
          </p>
          <form onSubmit={handleSaveEmail}>
            <div className="mac-field">
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
            <button type="submit" className="mac-btn" disabled={savingEmail}>
              {savingEmail ? 'Guardando...' : 'Actualizar correo'}
            </button>
          </form>
        </div>

        {/* Contraseña */}
        <div className="mac-settings-card">
          <div className="mac-settings-card-head">
            <Lock size={18} />
            <span>Contraseña</span>
          </div>
          <p className="mac-settings-hint">
            Elige una contraseña de al menos 6 caracteres.
          </p>
          <form onSubmit={handleSavePassword}>
            <div className="mac-field">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <div className="mac-pw-wrap">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="mac-pw-toggle" onClick={() => setShowNewPassword(v => !v)} tabIndex={-1}>
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="mac-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="mac-pw-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button type="button" className="mac-pw-toggle" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" className="mac-btn" disabled={savingPassword}>
              {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage;
