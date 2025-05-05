import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { User } from './useUsers';
import { Service } from './useServices';

type AxiosInstance = ReturnType<typeof axios.create>;

const API_BASE_URL = 
  import.meta.env.PROD
    ? (import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app')
    : 'http://localhost:8000';

const API_URL = `${API_BASE_URL}/api/appointments/`;
const SERVICES_API_URL = `${API_BASE_URL}/api/services/`;

export interface Appointment {
    id: number;
    client: number;
    client_name: string;
    service: number;
    service_name: string;
    employee: number;
    employee_name: string;
    date: string;
    start_time: string;
    end_time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes: string | null;
    created_at: string;
    updated_at: string;
}

export interface AppointmentFormData {
    client: number;
    service: number;
    employee: number;
    date: string;
    start_time: string;
    end_time?: string;
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    notes?: string;
}

export interface AppointmentsHook {
    appointments: Appointment[];
    loading: boolean;
    error: string | null;
    fetchAppointments: (filters?: AppointmentFilters) => Promise<void>;
    getAppointmentById: (id: number) => Promise<Appointment>;
    createAppointment: (appointmentData: AppointmentFormData) => Promise<Appointment>;
    updateAppointment: (id: number, appointmentData: AppointmentFormData) => Promise<Appointment>;
    deleteAppointment: (id: number) => Promise<boolean>;
    changeAppointmentStatus: (id: number, status: string) => Promise<Appointment>;
    checkEmployeeAvailability: (date: string, startTime: string, serviceId: number) => Promise<User[]>;
    fetchAvailableServices: () => Promise<Service[]>;
}

export interface AppointmentFilters {
    client?: number;
    service?: number;
    employee?: number;
    date_from?: string;
    date_to?: string;
    status?: string;
    period?: 'week' | 'month';
}

export const useAppointments = (): AppointmentsHook => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const { logout } = useAuth();
    const { showLoading, hideLoading } = useLoading();

    const createAxiosInstance = useCallback((): AxiosInstance => {
        const instance = axios.create({
            baseURL: '',
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

    const fetchAppointments = useCallback(async (filters?: AppointmentFilters): Promise<void> => {
        setLoading(true);
        setError(null);
        showLoading('Cargando citas...');

        try {
            const axiosInstance = createAxiosInstance();
            let url = API_URL;

            if (filters) {
                const queryParams = new URLSearchParams();

                if (filters.client) queryParams.append('client', filters.client.toString());
                if (filters.service) queryParams.append('service', filters.service.toString());
                if (filters.employee) queryParams.append('employee', filters.employee.toString());
                if (filters.date_from) queryParams.append('date_from', filters.date_from);
                if (filters.date_to) queryParams.append('date_to', filters.date_to);
                if (filters.status) queryParams.append('status', filters.status);
                if (filters.period) queryParams.append('period', filters.period);

                if (queryParams.toString()) {
                    url += `?${queryParams.toString()}`;
                }
            }

            const response = await axiosInstance.get<Appointment[]>(url);
            setAppointments(response.data);
        } catch (error) {
            setError('Error al cargar las citas');
            console.error('Error al cargar citas:', error);
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const getAppointmentById = useCallback(async (id: number): Promise<Appointment> => {
        setLoading(true);
        setError(null);
        showLoading('Cargando detalles de la cita...');

        try {
            const axiosInstance = createAxiosInstance();
            const response = await axiosInstance.get<Appointment>(`${API_URL}${id}/`);
            return response.data;
        } catch (error) {
            setError('Error al obtener los detalles de la cita');
            console.error(`Error al obtener cita con ID ${id}:`, error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const createAppointment = useCallback(async (appointmentData: AppointmentFormData): Promise<Appointment> => {
        setLoading(true);
        setError(null);
        showLoading('Creando cita...');

        try {
            const axiosInstance = createAxiosInstance();
            const response = await axiosInstance.post<Appointment>(API_URL, appointmentData);
            setAppointments(prevAppointments => [...prevAppointments, response.data]);
            return response.data;
        } catch (error) {
            setError('Error al crear la cita');
            console.error('Error al crear cita:', error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const updateAppointment = useCallback(async (id: number, appointmentData: AppointmentFormData): Promise<Appointment> => {
        setLoading(true);
        setError(null);
        showLoading('Actualizando cita...');

        try {
            const axiosInstance = createAxiosInstance();
            const response = await axiosInstance.put<Appointment>(`${API_URL}${id}/`, appointmentData);
            setAppointments(prevAppointments =>
                prevAppointments.map(appointment => appointment.id === id ? response.data : appointment)
            );
            return response.data;
        } catch (error) {
            setError('Error al actualizar la cita');
            console.error(`Error al actualizar cita con ID ${id}:`, error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const deleteAppointment = useCallback(async (id: number): Promise<boolean> => {
        setLoading(true);
        setError(null);
        showLoading('Eliminando cita...');

        try {
            const axiosInstance = createAxiosInstance();
            await axiosInstance.delete(`${API_URL}${id}/`);
            setAppointments(prevAppointments => prevAppointments.filter(appointment => appointment.id !== id));
            return true;
        } catch (error) {
            setError('Error al eliminar la cita');
            console.error(`Error al eliminar cita con ID ${id}:`, error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const changeAppointmentStatus = useCallback(async (id: number, status: string): Promise<Appointment> => {
        setLoading(true);
        setError(null);
        showLoading('Actualizando estado de la cita...');

        try {
            const axiosInstance = createAxiosInstance();
            const response = await axiosInstance.patch<Appointment>(`${API_URL}${id}/`, { status });
            // Actualizar la lista de citas
            setAppointments(prevAppointments =>
                prevAppointments.map(appointment => appointment.id === id ? response.data : appointment)
            );
            return response.data;
        } catch (error) {
            setError('Error al cambiar el estado de la cita');
            console.error(`Error al cambiar estado de la cita con ID ${id}:`, error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    const checkEmployeeAvailability = useCallback(async (date: string, startTime: string, serviceId: number): Promise<User[]> => {
        setLoading(true);
        setError(null);
        showLoading('Verificando disponibilidad...');

        try {
            const axiosInstance = createAxiosInstance();
            const url = `${API_URL}employee_availability/?date=${date}&start_time=${startTime}&service_id=${serviceId}`;

            const response = await axiosInstance.get<User[]>(url);
            return response.data;
        } catch (error) {
            setError('Error al verificar la disponibilidad');
            console.error('Error al verificar disponibilidad:', error);
            throw error;
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    // Nuevo método para obtener servicios disponibles para citas
    const fetchAvailableServices = useCallback(async (): Promise<Service[]> => {
        setLoading(true);
        setError(null);
        showLoading('Cargando servicios disponibles...');

        try {
            const axiosInstance = createAxiosInstance();
            const url = `${SERVICES_API_URL}available_for_appointments/`;
            const response = await axiosInstance.get<Service[]>(url);
            return response.data;
        } catch (error) {
            setError('Error al cargar los servicios disponibles');
            console.error('Error al cargar servicios disponibles:', error);
            return [];
        } finally {
            setLoading(false);
            hideLoading();
        }
    }, [createAxiosInstance, showLoading, hideLoading]);

    return {
        appointments,
        loading,
        error,
        fetchAppointments,
        getAppointmentById,
        createAppointment,
        updateAppointment,
        deleteAppointment,
        changeAppointmentStatus,
        checkEmployeeAvailability,
        fetchAvailableServices
    };
};