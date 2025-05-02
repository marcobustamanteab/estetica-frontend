/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// Tipo para Axios
type AxiosInstance = ReturnType<typeof axios.create>;

// Definir la base URL para la API de grupos
const API_BASE_URL = 
  import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
    : 'http://localhost:8000';

const API_URL = `${API_BASE_URL}/api/auth/groups/`;
const PERMISSIONS_URL = `${API_BASE_URL}/api/auth/permissions/`;

// Tipos
export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: {
    id: number;
    app_label: string;
    model: string;
  };
}

export interface Group {
  id: number;
  name: string;
  permissions: Permission[];
  user_set?: number[]; // IDs de usuarios que tienen este rol
}

export interface GroupFormData {
  name: string;
}

// Hook para manejar grupos y roles
export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  // Crear una instancia de axios con interceptores
  const createAxiosInstance = useCallback((): AxiosInstance => {
    const instance = axios.create({
      baseURL: '', // Se añadirá la URL específica en cada solicitud
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
  
  // Cargar todos los grupos
  const fetchGroups = useCallback(async (): Promise<Group[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando roles...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Group[]>(API_URL);
      setGroups(response.data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al cargar los roles';
      setError(errorMessage);
      console.error('Error al cargar roles:', error);
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener un grupo específico
  const fetchGroup = useCallback(async (id: number): Promise<Group | null> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles del rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Group>(`${API_URL}${id}/`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al cargar el rol';
      setError(errorMessage);
      console.error('Error fetching group:', error);
      return null;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener todos los permisos disponibles
  const fetchPermissions = useCallback(async (): Promise<Permission[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando permisos...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Permission[]>(PERMISSIONS_URL);
      setAvailablePermissions(response.data);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al cargar los permisos';
      setError(errorMessage);
      console.error('Error fetching permissions:', error);
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear un nuevo grupo
  const createGroup = useCallback(async (groupData: GroupFormData): Promise<Group> => {
    setLoading(true);
    setError(null);
    showLoading('Creando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.post<Group>(API_URL, groupData);
      setGroups(prevGroups => [...prevGroups, response.data]);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al crear el rol';
      setError(errorMessage);
      console.error('Error creating group:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar un grupo existente
  const updateGroup = useCallback(async (id: number, groupData: GroupFormData): Promise<Group> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<Group>(`${API_URL}${id}/`, groupData);
      setGroups(prevGroups => 
        prevGroups.map(group => 
          group.id === id ? { ...group, ...response.data } : group
        )
      );
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al actualizar el rol';
      setError(errorMessage);
      console.error('Error updating group:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Eliminar un grupo
  const deleteGroup = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${API_URL}${id}/`);
      setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al eliminar el rol';
      setError(errorMessage);
      console.error('Error deleting group:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar permisos de un grupo
  const updateGroupPermissions = useCallback(async (id: number, permissionIds: number[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando permisos del rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.put(`${API_URL}${id}/permissions/`, { permissions: permissionIds });
      
      // Actualizar la lista de grupos después de modificar los permisos
      await fetchGroups();
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 
                         error.response?.data?.message || 
                         'Error al actualizar los permisos';
      setError(errorMessage);
      console.error('Error updating group permissions:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, fetchGroups, showLoading, hideLoading]);
  
  return {
    groups,
    availablePermissions,
    loading,
    error,
    fetchGroups,
    fetchGroup,
    fetchPermissions,
    createGroup,
    updateGroup,
    deleteGroup,
    updateGroupPermissions
  };
};