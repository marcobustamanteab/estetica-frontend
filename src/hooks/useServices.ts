/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import { User } from "./useUsers";

type AxiosInstance = ReturnType<typeof axios.create>;

const API_BASE_URL =
  import.meta.env.PROD
    ? import.meta.env.VITE_API_URL ||
      "https://estetica-backend-production.up.railway.app"
    : "http://localhost:8000";

const API_URL = `${API_BASE_URL}/api/services/`;

const CATEGORIES_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL ||
    "https://estetica-backend-production.up.railway.app"
  : "http://localhost:8000";

const CATEGORIES_URL = `${CATEGORIES_BASE_URL}/api/services/categories/`;

export interface ServiceCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  allowed_roles?: { id: number; name: string }[];
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
  fetchServices: (categoryId?: number, businessId?: number | null) => Promise<void>;
  fetchCategories: (businessId?: number | null) => Promise<void>;
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
  fetchEmployeesByService: (serviceId: number) => Promise<User[]>;
}

export const useServices = (): ServicesHook => {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const createAxiosInstance = useCallback((): AxiosInstance => {
    const instance = axios.create({
      baseURL: "",
      headers: { "Content-Type": "application/json" },
    });

    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access");
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
        if (error.response?.status === 401) logout();
        return Promise.reject(error);
      }
    );

    return instance;
  }, [logout]);

  // Cargar servicios, opcionalmente filtrados por categoría y/o negocio
  const fetchServices = useCallback(
    async (categoryId?: number, businessId?: number | null): Promise<void> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando servicios...");

      try {
        const axiosInstance = createAxiosInstance();
        const params = new URLSearchParams();
        if (categoryId) params.append("category", categoryId.toString());
        if (businessId) params.append("business", businessId.toString());
        const url = params.toString() ? `${API_URL}?${params.toString()}` : API_URL;
        const response = await axiosInstance.get<Service[]>(url);
        setServices(response.data);
      } catch (error) {
        setError("Error al cargar los servicios");
        console.error("Error al cargar servicios:", error);
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  // Cargar categorías, opcionalmente filtradas por negocio
  const fetchCategories = useCallback(
    async (businessId?: number | null): Promise<void> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando categorías...");

      try {
        const axiosInstance = createAxiosInstance();
        const params = businessId ? `?business=${businessId}` : "";
        const response = await axiosInstance.get<ServiceCategory[]>(`${CATEGORIES_URL}${params}`);
        setCategories(response.data);
      } catch (error) {
        setError("Error al cargar las categorías");
        console.error("Error al cargar categorías:", error);
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  // Cargar categorías según el empleado seleccionado
  const fetchCategoriesByEmployee = useCallback(
    async (employeeId: number): Promise<ServiceCategory[]> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando categorías disponibles...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.get<ServiceCategory[]>(CATEGORIES_URL, {
          params: { employee_id: employeeId },
        });
        setCategories(response.data);
        return response.data;
      } catch (error) {
        setError("Error al cargar las categorías por empleado");
        console.error("Error al cargar categorías por empleado:", error);
        return [];
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const getServiceById = useCallback(
    async (id: number): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando detalles del servicio...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.get<Service>(`${API_URL}${id}/`);
        return response.data;
      } catch (error) {
        setError("Error al obtener los detalles del servicio");
        console.error(`Error al obtener servicio con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const getCategoryById = useCallback(
    async (id: number): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando detalles de la categoría...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.get<ServiceCategory>(`${CATEGORIES_URL}${id}/`);
        return response.data;
      } catch (error) {
        setError("Error al obtener los detalles de la categoría");
        console.error(`Error al obtener categoría con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const createService = useCallback(
    async (serviceData: ServiceFormData): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Creando servicio...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.post<Service>(API_URL, serviceData);
        setServices((prev) => [...prev, response.data]);
        return response.data;
      } catch (error) {
        setError("Error al crear el servicio");
        console.error("Error al crear servicio:", error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const updateService = useCallback(
    async (id: number, serviceData: ServiceFormData): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando servicio...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.put<Service>(`${API_URL}${id}/`, serviceData);
        setServices((prev) => prev.map((s) => (s.id === id ? response.data : s)));
        return response.data;
      } catch (error) {
        setError("Error al actualizar el servicio");
        console.error(`Error al actualizar servicio con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const deleteService = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      showLoading("Eliminando servicio...");
      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.delete(`${API_URL}${id}/`);
        setServices((prev) => prev.filter((s) => s.id !== id));
        return true;
      } catch (error) {
        setError("Error al eliminar el servicio");
        console.error(`Error al eliminar servicio con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const toggleServiceStatus = useCallback(
    async (id: number, isActive: boolean): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando estado del servicio...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.patch<Service>(`${API_URL}${id}/`, { is_active: !isActive });
        setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_active: !isActive } : s)));
        return response.data;
      } catch (error) {
        setError("Error al cambiar el estado del servicio");
        console.error(`Error al cambiar estado del servicio con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const createCategory = useCallback(
    async (categoryData: CategoryFormData): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Creando categoría...");
      try {
        const axiosInstance = createAxiosInstance();
        const { roles, ...categoryDataWithoutRoles } = categoryData;
        const response = await axiosInstance.post<ServiceCategory>(CATEGORIES_URL, categoryDataWithoutRoles);
        const newCategory = response.data;

        if (roles && roles.length > 0) {
          try {
            await axiosInstance.post(`${CATEGORIES_URL}${newCategory.id}/assign_roles/`, { roles });
          } catch (roleError: any) {
            console.error("Error al asignar roles a la categoría:", roleError);
            throw new Error(`Error al asignar roles: ${roleError.message}`);
          }
        }

        await fetchCategories();
        return newCategory;
      } catch (error) {
        setError("Error al crear la categoría");
        console.error("Error al crear categoría:", error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading, fetchCategories]
  );

  const updateCategory = useCallback(
    async (id: number, categoryData: CategoryFormData): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando categoría...");
      try {
        const axiosInstance = createAxiosInstance();
        const { roles, ...categoryDataWithoutRoles } = categoryData;
        const response = await axiosInstance.put<ServiceCategory>(`${CATEGORIES_URL}${id}/`, categoryDataWithoutRoles);

        if (roles && roles.length > 0) {
          try {
            await axiosInstance.post(`${CATEGORIES_URL}${id}/assign_roles/`, { roles });
          } catch (roleError) {
            console.error("Error al asignar roles en la actualización:", roleError);
          }
        }

        await fetchCategories();
        setCategories((prev) => prev.map((c) => (c.id === id ? response.data : c)));
        return response.data;
      } catch (error) {
        setError("Error al actualizar la categoría");
        console.error(`Error al actualizar categoría con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading, fetchCategories]
  );

  const deleteCategory = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      showLoading("Eliminando categoría...");
      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.delete(`${CATEGORIES_URL}${id}/`);
        setCategories((prev) => prev.filter((c) => c.id !== id));
        return true;
      } catch (error) {
        setError("Error al eliminar la categoría");
        console.error(`Error al eliminar categoría con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const toggleCategoryStatus = useCallback(
    async (id: number, isActive: boolean): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando estado de la categoría...");
      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.patch<ServiceCategory>(`${CATEGORIES_URL}${id}/`, { is_active: !isActive });
        setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: !isActive } : c)));
        return response.data;
      } catch (error) {
        setError("Error al cambiar el estado de la categoría");
        console.error(`Error al cambiar estado de la categoría con ID ${id}:`, error);
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  const fetchEmployeesByService = useCallback(
    async (serviceId: number): Promise<User[]> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando empleados disponibles...");

      try {
        const axiosInstance = createAxiosInstance();
        const serviceResponse = await axiosInstance.get<Service>(`${API_URL}${serviceId}/`);
        const service = serviceResponse.data;

        const usersResponse = await axiosInstance.get<User[]>(`${API_BASE_URL}/api/auth/users/`);
        const allUsers = usersResponse.data;

        const categoryResponse = await axiosInstance.get<ServiceCategory>(
          `${CATEGORIES_BASE_URL}/api/services/categories/${service.category}/`
        );
        const category = categoryResponse.data;

        let availableEmployees: User[];

        if (category.allowed_roles && category.allowed_roles.length > 0) {
          const allowedRoleIds = category.allowed_roles.map((role) => role.id);
          availableEmployees = allUsers.filter((user) => {
            if (!user.is_active || !user.groups || user.groups.length === 0) return false;
            const userRoleIds = user.groups.map((group: any) =>
              typeof group === "object" ? group.id : group
            );
            return userRoleIds.some((roleId) => allowedRoleIds.includes(roleId));
          });
        } else {
          availableEmployees = allUsers.filter(
            (user) => user.is_active && user.groups && user.groups.length > 0
          );
        }

        return availableEmployees;
      } catch (error) {
        setError("Error al cargar empleados por servicio");
        console.error("Error al cargar empleados por servicio:", error);
        try {
          const axiosInstance = createAxiosInstance();
          const response = await axiosInstance.get<User[]>(`${API_BASE_URL}/api/auth/users/`);
          return response.data.filter((user) => user.is_active && user.groups && user.groups.length > 0);
        } catch (fallbackError) {
          console.error("Error en fallback:", fallbackError);
          return [];
        }
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

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
    fetchCategoriesByEmployee,
    fetchEmployeesByService,
  };
};