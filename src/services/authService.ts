import axios from 'axios';

// Configuración de URLs (único cambio estructural)
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.MODE === 'development' 
    ? 'http://localhost:8000' 
    : 'https://estetica-backend-production.up.railway.app');

const API_AUTH_URL = `${API_BASE_URL}/api/auth/`;

interface LoginResponse {
  access: string;
  refresh: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

// Servicio (misma implementación, solo cambian las URLs)
const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<LoginResponse>(`${API_AUTH_URL}token/`, { 
        username,
        password 
      });
      
      if (response.data.access) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        return response.data;
      }
      throw new Error('No se recibieron tokens de acceso');
    } catch (error) {
      console.error('Error de login:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
  },
  
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }) => {
    return axios.post<UserData>(`${API_AUTH_URL}register/`, userData);
  },
  
  getProfile: async () => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      throw new Error('No hay token de acceso');
    }
    
    return axios.get<UserData>(`${API_AUTH_URL}profile/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  updateProfile: async (userData: Partial<UserData>) => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      throw new Error('No hay token de acceso');
    }
    
    return axios.patch<UserData>(`${API_AUTH_URL}profile/`, userData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('access');
  }
};

export default authService;