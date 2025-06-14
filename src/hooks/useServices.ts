/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useLoading } from "../context/LoadingContext";
import { User } from "./useUsers";

type AxiosInstance = ReturnType<typeof axios.create>;

const API_BASE_URL =
  // En producción, prioriza la variable de entorno o usa la URL de Railway
  import.meta.env.PROD
    ? import.meta.env.VITE_API_URL ||
      "https://estetica-backend-production.up.railway.app"
    : // En desarrollo, siempre usa localhost
      "http://localhost:8000";

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
  fetchServices: (categoryId?: number) => Promise<void>;
  fetchCategories: () => Promise<void>;
  getServiceById: (id: number) => Promise<Service>;
  getCategoryById: (id: number) => Promise<ServiceCategory>;
  createService: (serviceData: ServiceFormData) => Promise<Service>;
  updateService: (id: number, serviceData: ServiceFormData) => Promise<Service>;
  deleteService: (id: number) => Promise<boolean>;
  toggleServiceStatus: (id: number, isActive: boolean) => Promise<Service>;
  createCategory: (categoryData: CategoryFormData) => Promise<ServiceCategory>;
  updateCategory: (
    id: number,
    categoryData: CategoryFormData
  ) => Promise<ServiceCategory>;
  deleteCategory: (id: number) => Promise<boolean>;
  toggleCategoryStatus: (
    id: number,
    isActive: boolean
  ) => Promise<ServiceCategory>;
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

  // Crear una instancia de axios con interceptores
  const createAxiosInstance = useCallback((): AxiosInstance => {
    const instance = axios.create({
      baseURL: "",
      headers: {
        "Content-Type": "application/json",
      },
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
        if (error.response?.status === 401) {
          logout();
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [logout]);

  // Cargar servicios, opcionalmente filtrados por categoría
  const fetchServices = useCallback(
    async (categoryId?: number): Promise<void> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando servicios...");

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
        setError("Error al cargar los servicios");
        console.error("Error al cargar servicios:", error);
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  // Cargar categorías
  const fetchCategories = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    showLoading("Cargando categorías...");

    try {
      const axiosInstance = createAxiosInstance();
      const response = await axiosInstance.get<ServiceCategory[]>(
        CATEGORIES_URL
      );
      setCategories(response.data);
    } catch (error) {
      setError("Error al cargar las categorías");
      console.error("Error al cargar categorías:", error);
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  // Cargar categorías según el empleado seleccionado
  const fetchCategoriesByEmployee = useCallback(
    async (employeeId: number): Promise<ServiceCategory[]> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando categorías disponibles...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.get<ServiceCategory[]>(
          CATEGORIES_URL,
          {
            params: { employee_id: employeeId },
          }
        );
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

  // Obtener un servicio por ID
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

  // Obtener una categoría por ID
  const getCategoryById = useCallback(
    async (id: number): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Cargando detalles de la categoría...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.get<ServiceCategory>(
          `${CATEGORIES_URL}${id}/`
        );
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

  // Crear un nuevo servicio
  const createService = useCallback(
    async (serviceData: ServiceFormData): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Creando servicio...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.post<Service>(
          API_URL,
          serviceData
        );
        setServices((prevServices) => [...prevServices, response.data]);
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

  // Actualizar un servicio existente
  const updateService = useCallback(
    async (id: number, serviceData: ServiceFormData): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando servicio...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.put<Service>(
          `${API_URL}${id}/`,
          serviceData
        );
        // Actualizar la lista de servicios
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === id ? response.data : service
          )
        );
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

  // Eliminar un servicio
  const deleteService = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      showLoading("Eliminando servicio...");

      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.delete(`${API_URL}${id}/`);
        // Actualizar la lista de servicios eliminando el servicio
        setServices((prevServices) =>
          prevServices.filter((service) => service.id !== id)
        );
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

  // Cambiar el estado de un servicio
  const toggleServiceStatus = useCallback(
    async (id: number, isActive: boolean): Promise<Service> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando estado del servicio...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.patch<Service>(
          `${API_URL}${id}/`,
          { is_active: !isActive }
        );
        // Actualizar la lista de servicios
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === id ? { ...service, is_active: !isActive } : service
          )
        );
        return response.data;
      } catch (error) {
        setError("Error al cambiar el estado del servicio");
        console.error(
          `Error al cambiar estado del servicio con ID ${id}:`,
          error
        );
        throw error;
      } finally {
        setLoading(false);
        hideLoading();
      }
    },
    [createAxiosInstance, showLoading, hideLoading]
  );

  // Crear una nueva categoría
  const createCategory = useCallback(
    async (categoryData: CategoryFormData): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Creando categoría...");

      try {
        const axiosInstance = createAxiosInstance();

        // Extraer los roles antes de enviar los datos de la categoría
        const { roles, ...categoryDataWithoutRoles } = categoryData;

        console.log("Creando categoría con datos:", categoryDataWithoutRoles);

        // Paso 1: Crear la categoría
        const response = await axiosInstance.post<ServiceCategory>(
          CATEGORIES_URL,
          categoryDataWithoutRoles
        );
        const newCategory = response.data;

        console.log("Categoría creada:", newCategory);

        // Paso 2: Si hay roles seleccionados, asignarlos
        if (roles && roles.length > 0) {
          console.log(
            "Asignando roles:",
            roles,
            "a categoría ID:",
            newCategory.id
          );

          try {
            // Usar el endpoint para asignar roles con el formato correcto
            const roleResponse = await axiosInstance.post(
              `${CATEGORIES_URL}${newCategory.id}/assign_roles/`,
              { roles: roles } // Asegúrate de que este formato coincida con lo que espera el backend
            );

            console.log("Roles asignados correctamente:", roleResponse.data);
          } catch (roleError: any) {
            console.error("Error al asignar roles a la categoría:", roleError);

            // Mejor manejo de errores
            if (roleError.response?.data) {
              console.error("Detalles del error:", roleError.response.data);
            }

            // Propagar el error para que la UI muestre que algo falló
            throw new Error(`Error al asignar roles: ${roleError.message}`);
          }
        }

        // Recargar categorías para obtener datos actualizados
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

  // Actualizar una categoría existente
  const updateCategory = useCallback(
    async (
      id: number,
      categoryData: CategoryFormData
    ): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando categoría...");

      try {
        const axiosInstance = createAxiosInstance();

        // Extraer los roles antes de enviar los datos de la categoría
        const { roles, ...categoryDataWithoutRoles } = categoryData;

        // Actualizar datos básicos de la categoría
        const response = await axiosInstance.put<ServiceCategory>(
          `${CATEGORIES_URL}${id}/`,
          categoryDataWithoutRoles
        );

        // Si hay roles seleccionados, asignarlos
        if (roles && roles.length > 0) {
          try {
            // Usar el endpoint para asignar roles
            await axiosInstance.post(`${CATEGORIES_URL}${id}/assign_roles/`, {
              roles: roles,
            });
          } catch (roleError) {
            console.error(
              "Error al asignar roles en la actualización:",
              roleError
            );
          }
        }

        // Recargar categorías para tener datos actualizados
        await fetchCategories();

        // Actualizar la lista de categorías
        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category.id === id ? response.data : category
          )
        );

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

  // Eliminar una categoría
  const deleteCategory = useCallback(
    async (id: number): Promise<boolean> => {
      setLoading(true);
      setError(null);
      showLoading("Eliminando categoría...");

      try {
        const axiosInstance = createAxiosInstance();
        await axiosInstance.delete(`${CATEGORIES_URL}${id}/`);
        // Actualizar la lista de categorías eliminando la categoría
        setCategories((prevCategories) =>
          prevCategories.filter((category) => category.id !== id)
        );
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

  // Cambiar el estado de una categoría
  const toggleCategoryStatus = useCallback(
    async (id: number, isActive: boolean): Promise<ServiceCategory> => {
      setLoading(true);
      setError(null);
      showLoading("Actualizando estado de la categoría...");

      try {
        const axiosInstance = createAxiosInstance();
        const response = await axiosInstance.patch<ServiceCategory>(
          `${CATEGORIES_URL}${id}/`,
          { is_active: !isActive }
        );
        // Actualizar la lista de categorías
        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category.id === id
              ? { ...category, is_active: !isActive }
              : category
          )
        );
        return response.data;
      } catch (error) {
        setError("Error al cambiar el estado de la categoría");
        console.error(
          `Error al cambiar estado de la categoría con ID ${id}:`,
          error
        );
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

        // PASO 1: Obtener el servicio específico para conocer su categoría
        const serviceResponse = await axiosInstance.get<Service>(
          `${API_URL}${serviceId}/`
        );
        const service = serviceResponse.data;

        console.log(
          `Servicio obtenido: ${service.name}, Categoría ID: ${service.category}`
        );

        // PASO 2: Obtener todos los usuarios activos
        const usersResponse = await axiosInstance.get<User[]>(
          `${API_BASE_URL}/api/auth/users/`
        );
        const allUsers = usersResponse.data;

        // PASO 3: Obtener la categoría del servicio con sus roles permitidos
        const categoryResponse = await axiosInstance.get<ServiceCategory>(
          `${CATEGORIES_BASE_URL}/api/services/categories/${service.category}/`
        );
        const category = categoryResponse.data;

        console.log(`Categoría obtenida: ${category.name}`, category);

        // PASO 4: Filtrar empleados según los roles permitidos para esta categoría
        let availableEmployees: User[];

        if (category.allowed_roles && category.allowed_roles.length > 0) {
          // Si hay roles específicos asignados a la categoría
          const allowedRoleIds = category.allowed_roles.map((role) => role.id);
          console.log(`Roles permitidos para la categoría:`, allowedRoleIds);

          availableEmployees = allUsers.filter((user) => {
            if (!user.is_active || !user.groups || user.groups.length === 0) {
              return false;
            }

            // Verificar si el usuario tiene al menos uno de los roles permitidos
            const userRoleIds = user.groups.map((group: any) =>
              typeof group === "object" ? group.id : group
            );

            const hasPermittedRole = userRoleIds.some((roleId) =>
              allowedRoleIds.includes(roleId)
            );

            if (hasPermittedRole) {
              console.log(
                `Usuario ${user.username} tiene roles permitidos:`,
                userRoleIds
              );
            }

            return hasPermittedRole;
          });
        } else {
          // Si no hay roles específicos, mostrar todos los empleados activos con roles
          console.log(
            "No hay roles específicos asignados, mostrando todos los empleados activos"
          );
          availableEmployees = allUsers.filter(
            (user) => user.is_active && user.groups && user.groups.length > 0
          );
        }

        console.log(
          `Empleados disponibles para servicio ${service.name}:`,
          availableEmployees.length
        );
        return availableEmployees;
      } catch (error) {
        setError("Error al cargar empleados por servicio");
        console.error("Error al cargar empleados por servicio:", error);

        // Fallback: obtener todos los empleados activos
        try {
          const axiosInstance = createAxiosInstance();
          const response = await axiosInstance.get<User[]>(
            `${API_BASE_URL}/api/auth/users/`
          );
          const allUsers = response.data;

          const employees = allUsers.filter(
            (user) => user.is_active && user.groups && user.groups.length > 0
          );

          console.log(
            "Usando fallback, empleados encontrados:",
            employees.length
          );
          return employees;
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
