import { Mail, MapPin, Briefcase, User, Shield, CalendarCheck, CheckCircle } from 'lucide-react';
import './myProfile.css';

const MyProfilePage = () => {
  return (
    <div className="my-profile-page">
      {/* CARD IZQUIERDA */}
      <div className="profile-card">
        <div className="profile-avatar">
          <img
            src="https://i.pravatar.cc/150?img=38"
            alt="Avatar de usuario"
          />
        </div>
        <div className="profile-info">
          <h2 className="profile-name">Camila Rojas</h2>
          <p className="profile-role">Estilista Profesional</p>
          <div className="profile-details">
            <div className="profile-detail">
              <Mail size={16} />
              <span>camila.rojas@devsign.cl</span>
            </div>
            <div className="profile-detail">
              <Briefcase size={16} />
              <span>Devsingn E.I.R.L</span>
            </div>
            <div className="profile-detail">
              <MapPin size={16} />
              <span>Santiago, Chile</span>
            </div>
          </div>
        </div>
      </div>

      {/* CARD DERECHA */}
      <div className="info-card">
        <h3 className="info-title">Información del sistema</h3>
        <div className="info-item">
          <User size={16} />
          <span><strong>Usuario:</strong> crojas</span>
        </div>
        <div className="info-item">
          <Shield size={16} />
          <span><strong>Rol:</strong> Estilista</span>
        </div>
        <div className="info-item">
          <Briefcase size={16} />
          <span><strong>Área:</strong> Estética</span>
        </div>
        <div className="info-item">
          <CalendarCheck size={16} />
          <span><strong>Ingreso:</strong> 15 de marzo de 2022</span>
        </div>
        <div className="info-item">
          <CheckCircle size={16} />
          <span><strong>Estado:</strong> Activa</span>
        </div>
        <div className="info-item">
          <MapPin size={16} />
          <span><strong>Ubicación:</strong> Presencial</span>
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
