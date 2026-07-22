/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Users/MyProfilePage.tsx
import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Shield, 
  Clock, 
  Edit, 
  CheckCircle, 
  Upload,
  Users,
  Building
} from 'lucide-react';
import './myProfile.css';

// Definir las interfaces basadas en el código existente
interface UserGroup {
  id: number;
  name: string;
}

interface ExtendedUser {
  id: number;
  username: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  is_active: boolean;
  is_staff: boolean;
  groups?: Array<UserGroup | number>;
  profile_image?: string;
  // Estas son opcionales ya que no están en el tipo User base
  phone?: string;
  last_login?: string;
}

const API_BASE_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
  : 'http://localhost:8000';

const MyProfilePage: React.FC = () => {
  const { currentUser, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Función para obtener la fecha de ingreso formateada
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    
    const date = new Date(dateString);
    // Verificar si la fecha es válida
    if (isNaN(date.getTime())) return 'No disponible';
    
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric', 
      month: 'long', 
      year: 'numeric'
    }).format(date);
  };
  
  // Función para obtener los roles del usuario
  const getUserRoles = (): string[] => {
    if (!currentUser) return ['Sin roles asignados'];
    
    // Verificar si existe la propiedad 'groups' en currentUser
    const userGroups = (currentUser as unknown as ExtendedUser).groups;
    
    if (!userGroups || userGroups.length === 0) {
      return ['Sin roles asignados'];
    }
    
    // Comprobar si groups contiene objetos con propiedad name o solo IDs
    const firstItem = userGroups[0];
    
    if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem) {
      return userGroups.map((group) => (group as UserGroup).name);
    }
    
    // Si solo tenemos IDs, retornamos una representación genérica
    return userGroups.map((groupId) => `Rol ${groupId}`);
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) { alert('Solo se permiten imágenes JPG, PNG o WebP.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert(`La imagen supera 2 MB (${(file.size/1024/1024).toFixed(1)} MB).`); return; }
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append('profile_image', file);
      const res = await fetch(`${API_BASE_URL}/api/auth/profile/image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('access')}` },
        body: form,
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Error'); }
      await refreshUser();
    } catch (err: any) {
      alert(err.message || 'Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Determinar si el usuario es administrador
  const isUserAdmin = () => {
    return currentUser && (currentUser as unknown as ExtendedUser).is_staff === true;
  };

  // Obtener el estado de activación del usuario
  const isUserActive = () => {
    return currentUser && (currentUser as unknown as ExtendedUser).is_active === true;
  };

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <h2>Mi Perfil</h2>
        {!isEditing && (
          <button 
            className="edit-profile-button"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} /> Editar perfil
          </button>
        )}
      </div>
      
      <div className="profile-container">
        {/* Panel izquierdo: información personal */}
        <div className="profile-panel personal-info">
          <div className="profile-image-container">
            <div className="profile-image">
              {(currentUser as any)?.profile_image ? (
                <img src={(currentUser as any).profile_image} alt={currentUser?.first_name || 'Usuario'} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 36, fontWeight: 700, borderRadius: '50%' }}>
                  {(currentUser?.first_name?.[0] || '').toUpperCase()}{(currentUser?.last_name?.[0] || '').toUpperCase() || 'U'}
                </div>
              )}
              <button className="upload-image-button" onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} title="Cambiar foto">
                {uploadingPhoto ? '...' : <Upload size={16} />}
              </button>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" style={{ display: 'none' }} onChange={handleImageUpload} />
            </div>
          </div>
          
          <div className="profile-details">
            <h3>{currentUser?.first_name || ''} {currentUser?.last_name || ''}</h3>
            
            <div className="role-badges">
              {getUserRoles().map((role, idx) => (
                <span key={idx} className="role-badge">
                  {role}
                </span>
              ))}
            </div>
            
            <div className="profile-info-item">
              <Mail size={16} />
              <span>{currentUser?.email || 'No disponible'}</span>
            </div>
            
            <div className="profile-info-item">
              <Phone size={16} />
              <span>{(currentUser as unknown as ExtendedUser)?.phone || 'No disponible'}</span>
            </div>
            
            <div className="profile-info-item">
              <Calendar size={16} />
              <span>Ingreso: {formatDate((currentUser as any)?.date_joined)}</span>
            </div>
            
            <div className="profile-info-item">
              <Building size={16} />
              <span>BeautyCare Professional Services</span>
            </div>
          </div>
        </div>
        
        {/* Panel derecho: información del sistema y estadísticas */}
        <div className="profile-panel system-info">
          <h3>Información del sistema</h3>
          
          <div className="system-info-container">
            <div className="system-info-item">
              <div className="info-icon">
                <User size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Usuario</span>
                <span className="info-value">{currentUser?.username}</span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <Shield size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Tipo de cuenta</span>
                <span className="info-value">{isUserAdmin() ? 'Administrador' : 'Usuario'}</span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <Users size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Área</span>
                <span className="info-value">
                  {getUserRoles()[0] === 'Sin roles asignados' ? 'No asignada' : 'Estética'}
                </span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <Clock size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Último acceso</span>
                <span className="info-value">{formatDate((currentUser as any)?.last_login)}</span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <CheckCircle size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Estado</span>
                <span className={`info-value status ${isUserActive() ? 'active' : 'inactive'}`}>
                  {isUserActive() ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Paneles de estadísticas y actividad reciente */}
      <div className="profile-activity-container">
        <div className="profile-stats-panel">
          <h3>Estadísticas</h3>
          
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">23</div>
              <div className="stat-label">Citas completadas</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">12</div>
              <div className="stat-label">Clientes atendidos</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">98%</div>
              <div className="stat-label">Satisfacción</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">$2,450</div>
              <div className="stat-label">Ventas del mes</div>
            </div>
          </div>
        </div>
        
        <div className="profile-activity-panel">
          <h3>Actividad reciente</h3>
          
          <ul className="activity-list">
            <li className="activity-item">
              <div className="activity-dot completed"></div>
              <div className="activity-content">
                <div className="activity-title">Cita completada con María López</div>
                <div className="activity-time">Hace 2 horas - Corte de cabello</div>
              </div>
            </li>
            
            <li className="activity-item">
              <div className="activity-dot confirmed"></div>
              <div className="activity-content">
                <div className="activity-title">Nueva cita confirmada con Carlos Ruiz</div>
                <div className="activity-time">Hace 5 horas - Manicura</div>
              </div>
            </li>
            
            <li className="activity-item">
              <div className="activity-dot system"></div>
              <div className="activity-content">
                <div className="activity-title">Inicio de sesión en el sistema</div>
                <div className="activity-time">Hoy a las 8:30 AM</div>
              </div>
            </li>
            
            <li className="activity-item">
              <div className="activity-dot completed"></div>
              <div className="activity-content">
                <div className="activity-title">Cita completada con Ana García</div>
                <div className="activity-time">Ayer - Tratamiento facial</div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      
      {/* Formulario para editar perfil (se muestra solo cuando isEditing es true) */}
      {isEditing && (
        <div className="edit-profile-overlay">
          <div className="edit-profile-modal">
            <div className="modal-header">
              <h3>Editar perfil</h3>
              <button className="close-button" onClick={() => setIsEditing(false)}>×</button>
            </div>
            
            <form className="edit-profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">Nombre</label>
                  <input 
                    type="text" 
                    id="firstName" 
                    name="firstName" 
                    defaultValue={currentUser?.first_name || ''} 
                    className="form-input" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastName">Apellido</label>
                  <input 
                    type="text" 
                    id="lastName" 
                    name="lastName" 
                    defaultValue={currentUser?.last_name || ''} 
                    className="form-input" 
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    defaultValue={currentUser?.email || ''} 
                    className="form-input" 
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Teléfono</label>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    defaultValue={(currentUser as unknown as ExtendedUser)?.phone || ''} 
                    className="form-input" 
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password">Nueva contraseña (dejar en blanco para mantener la actual)</label>
                <input 
                  type="password" 
                  id="password" 
                  name="password" 
                  className="form-input" 
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
                <input 
                  type="password" 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  className="form-input" 
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="save-button">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfilePage;