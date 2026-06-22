/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import Avatar from '../../components/common/Avatar';
import { Mail, Lock, User, Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import './myAccount.css';

const MyAccountPage: React.FC = () => {
  const { currentUser } = useAuth();

  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const getUserRole = (): string => {
    const groups = (currentUser as any)?.groups;
    if (!groups || groups.length === 0) return 'Sin rol asignado';
    const first = groups[0];
    if (typeof first === 'object' && first !== null && 'name' in first) return first.name;
    return `Rol ${first}`;
  };

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
    <div className="my-account-page">
      <h2>Mi cuenta</h2>

      <div className="account-profile-card">
        <div className="account-avatar-wrapper">
          <Avatar
            firstName={currentUser?.first_name ?? ''}
            lastName={currentUser?.last_name ?? ''}
            size="large"
          />
        </div>
        <div className="account-profile-info">
          <h3>{currentUser?.first_name} {currentUser?.last_name}</h3>
          <span className="account-role-badge">{getUserRole()}</span>
          <div className="account-info-row">
            <User size={15} />
            <span>{currentUser?.username}</span>
          </div>
          <div className="account-info-row">
            <Mail size={15} />
            <span>{currentUser?.email}</span>
          </div>
          <div className="account-info-row">
            <Shield size={15} />
            <span>Trabajador</span>
          </div>
        </div>
      </div>

      <div className="account-edit-sections">
        <div className="account-edit-card">
          <h4>
            <Mail size={18} />
            Cambiar correo electrónico
          </h4>
          <p className="account-edit-hint">
            Correo actual: <strong>{currentUser?.email}</strong>
          </p>
          <form onSubmit={handleSaveEmail}>
            <div className="account-field">
              <label htmlFor="newEmail">Nuevo correo electrónico</label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                placeholder="nuevo@correo.com"
                required
              />
            </div>
            <button type="submit" className="account-save-btn" disabled={savingEmail}>
              {savingEmail ? 'Guardando...' : 'Guardar correo'}
            </button>
          </form>
        </div>

        <div className="account-edit-card">
          <h4>
            <Lock size={18} />
            Cambiar contraseña
          </h4>
          <form onSubmit={handleSavePassword}>
            <div className="account-field">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <div className="account-password-input">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="account-toggle-pw"
                  onClick={() => setShowNewPassword(v => !v)}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="account-field">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <div className="account-password-input">
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  className="account-toggle-pw"
                  onClick={() => setShowConfirm(v => !v)}
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" className="account-save-btn" disabled={savingPassword}>
              {savingPassword ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyAccountPage;
