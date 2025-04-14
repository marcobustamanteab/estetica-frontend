// src/hooks/useGroups.tsx
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// Tipos para permisos
export interface ContentType {
  id: number;
  app_label: string;
  model: string;
}

export interface Permission {
  id: number;
  name: string;
  codename: string;
  content_type: ContentType;
}

// Tipos para grupos
export interface Group {
  id: number;
  name: string;
  permissions?: Permission[];
  user_set?: {id: number; username: string}[];
}

export interface GroupFormData {
  name: string;
}

// Hook para gestionar grupos
export const useGroups = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  // Crear instancia de axios con interceptores
  const createAxiosInstance = useCallback(() => {
    const instance = axios.create({
      baseURL: 'http://localhost:8000/api/auth/',
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
  
  // Cargar grupos
  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);
    showLoading('Cargando roles...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Group[]>('groups/');
      setGroups(response.data);
    } catch (error) {
      setError('Error al cargar los roles');
      console.error('Error al cargar roles:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cargar permisos disponibles
  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    showLoading('Cargando permisos...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Permission[]>('permissions/');
      setAvailablePermissions(response.data);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener un grupo por ID
  const getGroupById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles del rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Group>(`groups/${id}/`);
      return response.data;
    } catch (error) {
      setError('Error al obtener los detalles del rol');
      console.error(`Error al obtener rol con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear un nuevo grupo
  const createGroup = useCallback(async (groupData: GroupFormData) => {
    setLoading(true);
    setError(null);
    showLoading('Creando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.post<Group>('groups/', groupData);
      setGroups(prevGroups => [...prevGroups, response.data]);
      return response.data;
    } catch (error) {
      setError('Error al crear el rol');
      console.error('Error al crear rol:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar un grupo existente
  const updateGroup = useCallback(async (id: number, groupData: GroupFormData) => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<Group>(`groups/${id}/`, groupData);
      // Actualizar la lista de grupos
      setGroups(prevGroups => prevGroups.map(group => group.id === id ? response.data : group));
      return response.data;
    } catch (error) {
      setError('Error al actualizar el rol');
      console.error(`Error al actualizar rol con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Eliminar un grupo
  const deleteGroup = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando rol...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`groups/${id}/`);
      // Actualizar la lista de grupos
      setGroups(prevGroups => prevGroups.filter(group => group.id !== id));
      return true;
    } catch (error) {
      setError('Error al eliminar el rol');
      console.error(`Error al eliminar rol con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar permisos de un grupo
  const updateGroupPermissions = useCallback(async (id: number, permissionIds: number[]) => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando permisos...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<Group>(`groups/${id}/permissions/`, {
        permissions: permissionIds
      });
      
      // Actualizar la lista de grupos
      setGroups(prevGroups => 
        prevGroups.map(group => group.id === id ? response.data : group)
      );
      
      return response.data;
    } catch (error) {
      setError('Error al actualizar los permisos');
      console.error(`Error al actualizar permisos del rol con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  return {
    groups,
    availablePermissions,
    loading,
    error,
    fetchGroups,
    fetchPermissions,
    getGroupById,
    createGroup,
    updateGroup,
    deleteGroup,
    updateGroupPermissions
  };
};