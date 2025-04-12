import axios from 'axios';

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

const API_URL = 'http://localhost:8000/api/auth/';

const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    try {
      const response = await axios.post<LoginResponse>(`${API_URL}token/`, { 
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
    return axios.post<UserData>(`${API_URL}register/`, userData);
  },
  
  getProfile: async () => {
    const token = localStorage.getItem('access');
    
    if (!token) {
      throw new Error('No hay token de acceso');
    }
    
    return axios.get<UserData>(`${API_URL}profile/`, {
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
    
    return axios.patch<UserData>(`${API_URL}profile/`, userData, {
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