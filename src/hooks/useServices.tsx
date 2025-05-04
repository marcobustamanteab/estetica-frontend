// src/hooks/useServices.tsx
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

// Tipo para Axios
type AxiosInstance = ReturnType<typeof axios.create>;

// Definir las base URL para la API
const API_BASE_URL = 
  // En producción, prioriza la variable de entorno o usa la URL de Railway
  import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
    // En desarrollo, siempre usa localhost
    : 'http://localhost:8000';

const API_URL = `${API_BASE_URL}/api/services/`;


const CATEGORIES_BASE_URL = 
  import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
    : 'http://localhost:8000';

const CATEGORIES_URL = `${CATEGORIES_BASE_URL}/api/services/categories/`;

// Tipos para manejar los servicios
export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  allowed_roles?: {id: number, name: string}[];
}

export interface Service {
  id: number;
  category: number;
  category_name: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceFormData {
  category: number;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  is_active?: boolean;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  is_active?: boolean;
  roles?: number[]; 
}


export interface ServicesHook {
  services: Service[];
  categories: ServiceCategory[];
  loading: boolean;
  error: string | null;
  fetchServices: (categoryId?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  getServiceById: (id: number) => Promise<Service>;
  getCategoryById: (id: number) => Promise<ServiceCategory>;
  createService: (serviceData: ServiceFormData) => Promise<Service>;
  updateService: (id: number, serviceData: ServiceFormData) => Promise<Service>;
  deleteService: (id: number) => Promise<boolean>;
  toggleServiceStatus: (id: number, isActive: boolean) => Promise<Service>;
  createCategory: (categoryData: CategoryFormData) => Promise<ServiceCategory>;
  updateCategory: (id: number, categoryData: CategoryFormData) => Promise<ServiceCategory>;
  deleteCategory: (id: number) => Promise<boolean>;
  toggleCategoryStatus: (id: number, isActive: boolean) => Promise<ServiceCategory>;
  fetchCategoriesByEmployee: (employeeId: number) => Promise<ServiceCategory[]>;
}

export const useServices = (): ServicesHook => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  
  // Crear una instancia de axios con interceptores
  const createAxiosInstance = useCallback((): AxiosInstance => {
    // Proporcionar un objeto de configuración vacío como mínimo
    const instance = axios.create({
      // Configuración base
      baseURL: '', // Añadiremos la URL específica en cada solicitud
      headers: {
        'Content-Type': 'application/json'
      }
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
  
  // Cargar servicios, opcionalmente filtrados por categoría
  const fetchServices = useCallback(async (categoryId?: number): Promise<void> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando servicios...');
    
    try {
      const axiosInstance = createAxiosInstance();
      let url = API_URL;
      
      // Si se especifica una categoría, filtramos por ella
      if (categoryId) {
        url += `?category=${categoryId}`;
      }
      
      const response = await axiosInstance.get<Service[]>(url);
      setServices(response.data);
    } catch (error) {
      setError('Error al cargar los servicios');
      console.error('Error al cargar servicios:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cargar categorías
  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando categorías...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<ServiceCategory[]>(CATEGORIES_URL);
      setCategories(response.data);
    } catch (error) {
      setError('Error al cargar las categorías');
      console.error('Error al cargar categorías:', error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  // Cargar categorías según el empleado seleccionado
  const fetchCategoriesByEmployee = useCallback(async (employeeId: number): Promise<ServiceCategory[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando categorías disponibles...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<ServiceCategory[]>(CATEGORIES_URL, {
        params: { employee_id: employeeId }
      });
      setCategories(response.data); // Actualizar el estado con las categorías filtradas
      return response.data;
    } catch (error) {
      setError('Error al cargar las categorías por empleado');
      console.error('Error al cargar categorías por empleado:', error);
      return []; // Retornar array vacío en caso de error
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener un servicio por ID
  const getServiceById = useCallback(async (id: number): Promise<Service> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles del servicio...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<Service>(`${API_URL}${id}/`);
      return response.data;
    } catch (error) {
      setError('Error al obtener los detalles del servicio');
      console.error(`Error al obtener servicio con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Obtener una categoría por ID
  const getCategoryById = useCallback(async (id: number): Promise<ServiceCategory> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando detalles de la categoría...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<ServiceCategory>(`${CATEGORIES_URL}${id}/`);
      return response.data;
    } catch (error) {
      setError('Error al obtener los detalles de la categoría');
      console.error(`Error al obtener categoría con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear un nuevo servicio
  const createService = useCallback(async (serviceData: ServiceFormData): Promise<Service> => {
    setLoading(true);
    setError(null);
    showLoading('Creando servicio...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.post<Service>(API_URL, serviceData);
      setServices(prevServices => [...prevServices, response.data]);
      return response.data;
    } catch (error) {
      setError('Error al crear el servicio');
      console.error('Error al crear servicio:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Actualizar un servicio existente
  const updateService = useCallback(async (id: number, serviceData: ServiceFormData): Promise<Service> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando servicio...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.put<Service>(`${API_URL}${id}/`, serviceData);
      // Actualizar la lista de servicios
      setServices(prevServices => prevServices.map(service => service.id === id ? response.data : service));
      return response.data;
    } catch (error) {
      setError('Error al actualizar el servicio');
      console.error(`Error al actualizar servicio con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Eliminar un servicio
  const deleteService = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando servicio...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${API_URL}${id}/`);
      // Actualizar la lista de servicios eliminando el servicio
      setServices(prevServices => prevServices.filter(service => service.id !== id));
      return true;
    } catch (error) {
      setError('Error al eliminar el servicio');
      console.error(`Error al eliminar servicio con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cambiar el estado de un servicio
  const toggleServiceStatus = useCallback(async (id: number, isActive: boolean): Promise<Service> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando estado del servicio...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.patch<Service>(`${API_URL}${id}/`, { is_active: !isActive });
      // Actualizar la lista de servicios
      setServices(prevServices => 
        prevServices.map(service => 
          service.id === id ? { ...service, is_active: !isActive } : service
        )
      );
      return response.data;
    } catch (error) {
      setError('Error al cambiar el estado del servicio');
      console.error(`Error al cambiar estado del servicio con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Crear una nueva categoría
  const createCategory = useCallback(async (categoryData: CategoryFormData): Promise<ServiceCategory> => {
    setLoading(true);
    setError(null);
    showLoading('Creando categoría...');
    
    try {
      const axiosInstance = createAxiosInstance();
      
      // Extraer los roles antes de enviar los datos de la categoría
      const { roles, ...categoryDataWithoutRoles } = categoryData;
      
      console.log("Creando categoría con datos:", categoryDataWithoutRoles);
      
      // Paso 1: Crear la categoría
      const response = await axiosInstance.post<ServiceCategory>(CATEGORIES_URL, categoryDataWithoutRoles);
      const newCategory = response.data;
      
      console.log("Categoría creada:", newCategory);
      
      // Paso 2: Si hay roles seleccionados, usar el nuevo endpoint
      if (roles && roles.length > 0) {
        try {
          console.log("Asignando roles:", roles, "a categoría ID:", newCategory.id);
          
          // Usar el nuevo endpoint para asignar roles
          await axiosInstance.post(
            `${CATEGORIES_URL}${newCategory.id}/assign_roles/`, 
            { roles: roles }
          );
          
          console.log("Roles asignados correctamente");
        } catch (roleError) {
          console.error('Error al asignar roles a la categoría:', roleError);
        }
      }
      
      // Recargar categorías para obtener datos actualizados
      await fetchCategories();
      return newCategory;
    } catch (error) {
      setError('Error al crear la categoría');
      console.error('Error al crear categoría:', error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading, fetchCategories]);
  
  // Actualizar una categoría existente
  const updateCategory = useCallback(async (id: number, categoryData: CategoryFormData): Promise<ServiceCategory> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando categoría...');
    
    try {
      const axiosInstance = createAxiosInstance();
      
      // Extraer los roles antes de enviar los datos de la categoría
      const { roles, ...categoryDataWithoutRoles } = categoryData;
      
      // Actualizar datos básicos de la categoría
      const response = await axiosInstance.put<ServiceCategory>(`${CATEGORIES_URL}${id}/`, categoryDataWithoutRoles);
      
      // Si hay roles seleccionados, asignarlos
      if (roles && roles.length > 0) {
        try {
          // Usar el endpoint para asignar roles
          await axiosInstance.post(
            `${CATEGORIES_URL}${id}/assign_roles/`, 
            { roles: roles }
          );
        } catch (roleError) {
          console.error('Error al asignar roles en la actualización:', roleError);
        }
      }
      
      // Recargar categorías para tener datos actualizados
      await fetchCategories();
      
      // Actualizar la lista de categorías
      setCategories(prevCategories => 
        prevCategories.map(category => category.id === id ? response.data : category)
      );
      
      return response.data;
    } catch (error) {
      setError('Error al actualizar la categoría');
      console.error(`Error al actualizar categoría con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading, fetchCategories]);
  
  // Eliminar una categoría
  const deleteCategory = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    showLoading('Eliminando categoría...');
    
    try {
      const axiosInstance = createAxiosInstance();
      await axiosInstance.delete(`${CATEGORIES_URL}${id}/`);
      // Actualizar la lista de categorías eliminando la categoría
      setCategories(prevCategories => prevCategories.filter(category => category.id !== id));
      return true;
    } catch (error) {
      setError('Error al eliminar la categoría');
      console.error(`Error al eliminar categoría con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  // Cambiar el estado de una categoría
  const toggleCategoryStatus = useCallback(async (id: number, isActive: boolean): Promise<ServiceCategory> => {
    setLoading(true);
    setError(null);
    showLoading('Actualizando estado de la categoría...');
    
    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.patch<ServiceCategory>(`${CATEGORIES_URL}${id}/`, { is_active: !isActive });
      // Actualizar la lista de categorías
      setCategories(prevCategories => 
        prevCategories.map(category => 
          category.id === id ? { ...category, is_active: !isActive } : category
        )
      );
      return response.data;
    } catch (error) {
      setError('Error al cambiar el estado de la categoría');
      console.error(`Error al cambiar estado de la categoría con ID ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);
  
  return {
    services,
    categories,
    loading,
    error,
    fetchServices,
    fetchCategories,
    getServiceById,
    getCategoryById,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    fetchCategoriesByEmployee
  };
};