/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import authService from '../services/authService';

// Define interfaces
interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<any>;
  isAuthenticated: () => boolean;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Crear el contexto de autenticación con valor por defecto
const AuthContext = createContext<AuthContextType | null>(null);

// Hook personalizado para acceder al contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// Pequeña función de ayuda para esperar que localStorage se actualice
const ensureTokenSaved = async (token: string): Promise<void> => {
  const MAX_RETRIES = 10;
  const RETRY_DELAY = 50; // ms
  
  for (let i = 0; i < MAX_RETRIES; i++) {
    const savedToken = localStorage.getItem('access');
    if (savedToken === token) {
      return;
    }
    // Esperar un poco antes de volver a verificar
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  }
  
  // Si llegamos aquí, algo salió mal con localStorage
  console.warn('No se pudo verificar que el token se guardó correctamente');
};

// Proveedor del contexto de autenticación
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          const response = await authService.getProfile();
          setCurrentUser(response.data);
        } catch (error) {
          console.error('Error al cargar perfil:', error);
          authService.logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Función para iniciar sesión con corrección de timing
  const login = async (username: string, password: string) => {
    setError(null);
    try {
      // 1. Hacer login y obtener el token
      const loginResponse = await authService.login(username, password);
      
      // 2. Asegurarnos de que el token se guardó correctamente
      await ensureTokenSaved(loginResponse.access);
      
      // 3. Obtener el perfil del usuario
      try {
        const profileResponse = await authService.getProfile();
        setCurrentUser(profileResponse.data);
      } catch (profileError) {
        console.error('Error al cargar perfil después del login:', profileError);
        throw new Error('Error al cargar el perfil de usuario');
      }
      
      return loginResponse;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw error;
    }
  };

  // Función para cerrar sesión
  const logout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  // Función para registrar usuario
  const register = async (userData: RegisterData) => {
    setError(null);
    try {
      const response = await authService.register(userData);
      return response.data;
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Error al registrarse');
      throw error;
    }
  };

  // Valores a proporcionar en el contexto
  const value: AuthContextType = {
    currentUser,
    loading,
    error,
    login,
    logout,
    register,
    isAuthenticated: authService.isAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;