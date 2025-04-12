/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './registerPage.css'; // Importar el CSS externo

interface FormData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name: string;
  last_name: string;
}

interface Errors {
  [key: string]: string[] | undefined;
  non_field_errors?: string[];
}

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    try {
      // Intentar registrar al usuario
      await register(formData);
      
      // Si el registro es exitoso, iniciar sesión automáticamente
      await login(formData.username, formData.password);
      
      // Redirigir al dashboard
      navigate('/dashboard');
    } catch (error: any) {
      // Manejar errores de validación del backend
      if (error.response?.status === 400) {
        setErrors(error.response.data);
      } else {
        setErrors({ 
          non_field_errors: ['Ocurrió un error durante el registro. Inténtalo de nuevo.'] 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-main-box">
        <div className="register-header">
          <h2 className="register-title">Beauty Care</h2>
          <p className="register-subtitle">Crea tu cuenta para comenzar</p>
        </div>
        
        {errors.non_field_errors && (
          <div className="error-message">
            <p>{errors.non_field_errors.join(', ')}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name" className="form-label">Nombre</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
              />
              {errors.first_name && <p className="error-field">{errors.first_name.join(', ')}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="last_name" className="form-label">Apellido</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
              />
              {errors.last_name && <p className="error-field">{errors.last_name.join(', ')}</p>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="username" className="form-label">Nombre de usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="form-input"
              value={formData.username}
              onChange={handleChange}
            />
            {errors.username && <p className="error-field">{errors.username.join(', ')}</p>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email" className="form-label">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="form-input"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <p className="error-field">{errors.email.join(', ')}</p>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && <p className="error-field">{errors.password.join(', ')}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password2" className="form-label">Confirmar contraseña</label>
              <input
                id="password2"
                name="password2"
                type="password"
                required
                className="form-input"
                value={formData.password2}
                onChange={handleChange}
              />
              {errors.password2 && <p className="error-field">{errors.password2.join(', ')}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="register-button"
          >
            {isLoading ? 'Registrando...' : 'Registrarse'}
          </button>
          
          <div className="register-footer">
            <p>
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="register-link">
                Iniciar sesión
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;