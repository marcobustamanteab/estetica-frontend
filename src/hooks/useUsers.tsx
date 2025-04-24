import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// Tipo para Axios
type AxiosInstance = ReturnType<typeof axios.create>;

// Definir la base URL para la API de usuarios
const API_BASE_URL = 
  import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
    : 'http://localhost:8000';

const API_URL = `${API_BASE_URL}/api/auth/users/`;

// Tipos para manejar los usuarios
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  profile_image?: string;
  groups?: number[];
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  is_staff?: boolean;
  groups?: number[]; 
}

export interface UsersHook {
  users: User[];
  loading: boolean;
  error: string | null;
  fetchUsers: () => Promise<void>;
  getUserById: (id: number) => Promise<User>;
  createUser: (userData: UserFormData) => Promise<User>;
  updateUser: (id: number, userData: UserFormData) => Promise<User>;
  deleteUser: (id: number) => Promise<boolean>;
  toggleUserStatus: (id: number, isActive: boolean) => Promise<User>;
}

export const useUsers = (): UsersHook => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  // Crear una instancia de axios con interceptores
  const createAxiosInstance = useCallback((): AxiosInstance => {
    const instance = axios.create({
      baseURL: API_URL,
    });
    
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );
    
    return instance;
  }, [logout]);
  
  // Cargar usuarios
  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando usuarios...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<User[]>('');
      setUsers(response.data);
    } catch (error) {
      setError('Error al cargar los usuarios');
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener un usuario por ID
  const getUserById = useCallback(async (id: number): Promise<User> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles del usuario...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<User>(`${id}/`);
      return response.data;
    } catch (error) {
      setError('Error al obtener los detalles del usuario');
      console.error(`Error al obtener usuario con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear un nuevo usuario
  const createUser = useCallback(async (userData: UserFormData): Promise<User> => {
    setLoading(true);
    setError(null);
    showLoading('Creando usuario...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.post<User>('', userData);
      setUsers(prevUsers => [...prevUsers, response.data]);
      return response.data;
    } catch (error) {
      setError('Error al crear el usuario');
      console.error('Error al crear usuario:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar un usuario existente
  const updateUser = useCallback(async (id: number, userData: UserFormData): Promise<User> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando usuario...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<User>(`${id}/`, userData);
      // Actualizar la lista de usuarios
      setUsers(prevUsers => prevUsers.map(user => user.id === id ? response.data : user));
      return response.data;
    } catch (error) {
      setError('Error al actualizar el usuario');
      console.error(`Error al actualizar usuario con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Eliminar un usuario
  const deleteUser = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando usuario...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${id}/`);
      // Actualizar la lista de usuarios eliminando el usuario
      setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
      return true;
    } catch (error) {
      setError('Error al eliminar el usuario');
      console.error(`Error al eliminar usuario con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cambiar el estado de un usuario
  const toggleUserStatus = useCallback(async (id: number, isActive: boolean): Promise<User> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando estado del usuario...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.patch<User>(`${id}/`, { is_active: !isActive });
      // Actualizar la lista de usuarios
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === id ? { ...user, is_active: !isActive } : user)
      );
      return response.data;
    } catch (error) {
      setError('Error al cambiar el estado del usuario');
      console.error(`Error al cambiar estado del usuario con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  return {
    users,
    loading,
    error,
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  };
};