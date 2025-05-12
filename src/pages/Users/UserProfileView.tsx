/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../context/AuthContext';
import { 
  Mail, 
  Phone, 
  Calendar, 
  User, 
  Shield, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Users,
  Building
} from 'lucide-react';
import './myProfile.css'; // Reutilizamos los estilos del perfil

// Interfaces necesarias para el componente
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
  phone?: string;
  last_login?: string;
}

const UserProfileView: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { users, fetchUsers } = useUsers();
  const { groups, fetchGroups } = useGroups();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar usuario específico y grupos
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Verificar si el usuario actual es administrador
        if (!(currentUser as unknown as ExtendedUser)?.is_staff) {
          setError('No tienes permisos para ver este perfil');
          setLoading(false);
          return;
        }
        
        // Cargar usuarios si aún no están cargados
        if (users.length === 0) {
          await fetchUsers();
        }
        
        // Cargar grupos si aún no están cargados
        await fetchGroups();
        
        // Buscar el usuario específico
        const user = users.find(u => u.id === Number(userId));
        
        if (!user) {
          setError('Usuario no encontrado');
          setLoading(false);
          return;
        }
        
        setUserProfile(user as unknown as ExtendedUser);
        setLoading(false);
      } catch (error) {
        console.error('Error cargando datos del perfil:', error);
        setError('Error cargando perfil de usuario');
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId, users, fetchUsers, fetchGroups, currentUser]);

  // Función para obtener la fecha formateada
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
    if (!userProfile?.groups || userProfile.groups.length === 0) {
      return ['Sin roles asignados'];
    }
    
    // Comprobar si groups contiene objetos con propiedad name o solo IDs
    const firstItem = userProfile.groups[0];
    
    if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem) {
      return userProfile.groups.map((group) => (group as UserGroup).name);
    }
    
    // Si son IDs, intentar encontrar los nombres en la lista de grupos
    return userProfile.groups.map((groupId) => {
      if (typeof groupId === 'number') {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : `Rol ${groupId}`;
      }
      return `Rol ${groupId}`;
    });
  };

  // Si está cargando, mostrar indicador
  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-message">Cargando perfil de usuario...</div>
      </div>
    );
  }

  // Si hay un error, mostrarlo
  if (error) {
    return (
      <div className="profile-page">
        <div className="error-alert">
          <p>{error}</p>
          <button 
            className="back-button"
            onClick={() => navigate('/usuarios')}
          >
            Volver a la lista de usuarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <div className="back-button-container">
          <button 
            className="back-button"
            onClick={() => navigate('/usuarios')}
          >
            <ArrowLeft size={16} /> Volver a usuarios
          </button>
          <h2>Perfil de {userProfile?.first_name} {userProfile?.last_name}</h2>
        </div>
      </div>
      
      <div className="profile-container">
        {/* Panel izquierdo: información personal */}
        <div className="profile-panel personal-info">
          <div className="profile-image-container">
            <div className="profile-image">
              <img 
                src={'/default-avatar.png'} 
                alt={`${userProfile?.first_name || 'Usuario'}`} 
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150?img=38'; // Imagen fallback
                }}
              />
            </div>
          </div>
          
          <div className="profile-details">
            <h3>{userProfile?.first_name || ''} {userProfile?.last_name || ''}</h3>
            
            <div className="role-badges">
              {getUserRoles().map((role, idx) => (
                <span key={idx} className="role-badge">
                  {role}
                </span>
              ))}
            </div>
            
            <div className="profile-info-item">
              <Mail size={16} />
              <span>{userProfile?.email || 'No disponible'}</span>
            </div>
            
            <div className="profile-info-item">
              <Phone size={16} />
              <span>{userProfile?.phone || 'No disponible'}</span>
            </div>
            
            <div className="profile-info-item">
              <Calendar size={16} />
              <span>Ingreso: {formatDate((userProfile as any)?.date_joined)}</span>
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
                <span className="info-value">{userProfile?.username}</span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <Shield size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Tipo de cuenta</span>
                <span className="info-value">{userProfile?.is_staff ? 'Administrador' : 'Usuario'}</span>
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
                <span className="info-value">{formatDate((userProfile as any)?.last_login)}</span>
              </div>
            </div>
            
            <div className="system-info-item">
              <div className="info-icon">
                <CheckCircle size={20} />
              </div>
              <div className="info-details">
                <span className="info-label">Estado</span>
                <span className={`info-value status ${userProfile?.is_active ? 'active' : 'inactive'}`}>
                  {userProfile?.is_active ? 'Activo' : 'Inactivo'}
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
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;