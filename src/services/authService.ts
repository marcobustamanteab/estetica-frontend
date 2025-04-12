import axios from 'axios';

// Configuración base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app';
const API_AUTH_URL = `${API_BASE_URL}/api/auth/`;

// Tipos de datos
interface LoginResponse {
  access: string;
  refresh: string;
  user?: UserData; // Si tu backend incluye información de usuario en la respuesta
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_image?: string;
}

// Configuración global de Axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para añadir token a las peticiones
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores de autenticación
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Puedes agregar lógica para refrescar el token aquí si es necesario
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      window.location.href = '/login'; // Redirigir a login
    }
    return Promise.reject(error);
  }
);

const authService = {
  /**
   * Inicia sesión y almacena los tokens
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await apiClient.post<LoginResponse>(`${API_AUTH_URL}token/`, { 
        username,
        password 
      });
      
      if (response.data.access) {
        localStorage.setItem('access', response.data.access);
        localStorage.setItem('refresh', response.data.refresh);
        
        // Si el backend no devuelve el usuario, lo obtenemos por separado
        if (!response.data.user) {
          const userProfile = await authService.getProfile();
          return { ...response.data, user: userProfile.data };
        }
        
        return response.data;
      }
      throw new Error('No se recibieron tokens de acceso');
    } catch (error) {
      console.error('Error de login:', error);
      throw new Error('Credenciales inválidas o problema de conexión');
    }
  },
  
  /**
   * Cierra la sesión eliminando los tokens
   */
  logout: () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    // Opcional: llamar a endpoint de logout del backend si existe
    // return apiClient.post(`${API_AUTH_URL}logout/`);
  },
  
  /**
   * Registra un nuevo usuario
   */
  register: async (userData: {
    username: string;
    email: string;
    password: string;
    password2: string;
    first_name?: string;
    last_name?: string;
  }): Promise<{ data: UserData }> => {
    return apiClient.post(`${API_AUTH_URL}register/`, userData);
  },
  
  /**
   * Obtiene el perfil del usuario autenticado
   */
  getProfile: async (): Promise<{ data: UserData }> => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      throw new Error('No hay token de acceso');
    }
    
    return apiClient.get(`${API_AUTH_URL}profile/`);
  },
  
  /**
   * Actualiza el perfil del usuario
   */
  updateProfile: async (userData: Partial<UserData>): Promise<{ data: UserData }> => {
    return apiClient.patch(`${API_AUTH_URL}profile/`, userData);
  },
  
  /**
   * Verifica si hay un usuario autenticado
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('access');
  },
  
  /**
   * Refresca el token de acceso (opcional)
   */
  refreshToken: async (): Promise<LoginResponse> => {
    const refreshToken = localStorage.getItem('refresh');
    
    if (!refreshToken) {
      throw new Error('No hay token de refresco');
    }
    
    try {
      const response = await apiClient.post<LoginResponse>(`${API_AUTH_URL}token/refresh/`, { 
        refresh: refreshToken 
      });
      
      if (response.data.access) {
        localStorage.setItem('access', response.data.access);
        return response.data;
      }
      throw new Error('No se recibió nuevo token de acceso');
    } catch (error) {
      console.error('Error al refrescar token:', error);
      authService.logout();
      throw error;
    }
  }
};

export default authService;