/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import './loginPage.css';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (error: any) {
      setErrorMessage(
        error.response?.data?.detail || 
        'No se pudo iniciar sesión. Verifica tus credenciales.'
      );
      setIsLoading(false); // Solo desactivamos loading si hay error
    }
  };

  return (
    <div className="login-container">
      {/* Spinner a pantalla completa, centrado */}
      {isLoading && <Spinner text="Iniciando sesión..." />}
      
      <div className="login-main-box">
        {/* Columna del formulario */}
        <div className="form-column">
          <div className="content-box">
            <h2 className="form-title">Beauty Care</h2>
            <p className="form-subtitle">Inicia sesión para acceder a tu cuenta</p>
            
            {errorMessage && (
              <div className="error-message">
                <p>{errorMessage}</p>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  Nombre de usuario
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="login-button"
              >
                Iniciar sesión
              </button>
              
              <div className="login-footer">
                <p>
                  ¿No tienes una cuenta?{' '}
                  <Link to="/register" className="login-link">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
        
        {/* Columna de imagen */}
        <div className="image-column">
          <div className="overlay"></div>
          <div className="image-background"></div>
          
          <div className="image-content">
            <h1 className="image-title">Beauty Care</h1>
            <p style={{fontSize: '20px'}}>Tu centro de belleza y bienestar</p>
            <div className="divider"></div>
            <p className="image-paragraph">
              Descubre nuestros servicios premium de belleza y cuidado personal. 
              Tu experiencia de relajación comienza aquí.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;