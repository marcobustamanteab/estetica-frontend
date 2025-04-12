import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// Tipo para Axios
type AxiosInstance = ReturnType<typeof axios.create>;

// Definir la base URL para la API de clientes
const API_URL = 'http://localhost:8000/api/clients/';

// Tipos para manejar los clientes
export interface Client {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  gender: 'M' | 'F' | 'O' | null;
  birth_date: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientFormData {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string | null;
    gender?: 'M' | 'F' | 'O' | null; 
    birth_date?: string | null;
    address?: string | null;
    is_active?: boolean;
  }

export interface ClientsHook {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  getClientById: (id: number) => Promise<Client>;
  createClient: (clientData: ClientFormData) => Promise<Client>;
  updateClient: (id: number, clientData: ClientFormData) => Promise<Client>;
  deleteClient: (id: number) => Promise<boolean>;
  toggleClientStatus: (id: number, isActive: boolean) => Promise<Client>;
}

export const useClients = (): ClientsHook => {
  const [clients, setClients] = useState<Client[]>([]);
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
  
  // Cargar clientes
  const fetchClients = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando clientes...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Client[]>('');
      setClients(response.data);
    } catch (error) {
      setError('Error al cargar los clientes');
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener un cliente por ID
  const getClientById = useCallback(async (id: number): Promise<Client> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles del cliente...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Client>(`${id}/`);
      return response.data;
    } catch (error) {
      setError('Error al obtener los detalles del cliente');
      console.error(`Error al obtener cliente con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear un nuevo cliente
  const createClient = useCallback(async (clientData: ClientFormData): Promise<Client> => {
    setLoading(true);
    setError(null);
    showLoading('Creando cliente...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.post<Client>('', clientData);
      setClients(prevClients => [...prevClients, response.data]);
      return response.data;
    } catch (error) {
      setError('Error al crear el cliente');
      console.error('Error al crear cliente:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar un cliente existente
  const updateClient = useCallback(async (id: number, clientData: ClientFormData): Promise<Client> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando cliente...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<Client>(`${id}/`, clientData);
      // Actualizar la lista de clientes
      setClients(prevClients => prevClients.map(client => client.id === id ? response.data : client));
      return response.data;
    } catch (error) {
      setError('Error al actualizar el cliente');
      console.error(`Error al actualizar cliente con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Eliminar un cliente
  const deleteClient = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando cliente...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${id}/`);
      // Actualizar la lista de clientes eliminando el cliente
      setClients(prevClients => prevClients.filter(client => client.id !== id));
      return true;
    } catch (error) {
      setError('Error al eliminar el cliente');
      console.error(`Error al eliminar cliente con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cambiar el estado de un cliente
  const toggleClientStatus = useCallback(async (id: number, isActive: boolean): Promise<Client> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando estado del cliente...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.patch<Client>(`${id}/`, { is_active: !isActive });
      // Actualizar la lista de clientes
      setClients(prevClients => 
        prevClients.map(client => 
          client.id === id ? { ...client, is_active: !isActive } : client
        )
      );
      return response.data;
    } catch (error) {
      setError('Error al cambiar el estado del cliente');
      console.error(`Error al cambiar estado del cliente con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  return {
    clients,
    loading,
    error,
    fetchClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus
  };
};