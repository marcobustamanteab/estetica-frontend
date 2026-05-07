import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

type AxiosInstance = ReturnType<typeof axios.create>;

const API_BASE_URL =
  import.meta.env.PROD
    ? import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app'
    : 'http://localhost:8000';

const API_URL = `${API_BASE_URL}/api/auth/schedules/`;

export interface WorkSchedule {
  id: number;
  employee: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface WorkScheduleFormData {
  employee: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

export const useWorkSchedules = () => {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const createAxiosInstance = useCallback((): AxiosInstance => {
    const instance = axios.create({ baseURL: '' });
    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('access');
      if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    instance.interceptors.response.use(
      (r) => r,
      (err) => { if (err.response?.status === 401) logout(); return Promise.reject(err); }
    );
    return instance;
  }, [logout]);

  const fetchSchedules = useCallback(async (employeeId?: number): Promise<WorkSchedule[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando horarios...');
    try {
      const ax = createAxiosInstance();
      const url = employeeId ? `${API_URL}?employee=${employeeId}` : API_URL;
      const res = await ax.get<WorkSchedule[]>(url);
      setSchedules(res.data);
      return res.data;
    } catch {
      setError('Error al cargar los horarios');
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  const createSchedule = useCallback(async (data: WorkScheduleFormData): Promise<WorkSchedule> => {
    setLoading(true);
    showLoading('Guardando horario...');
    try {
      const ax = createAxiosInstance();
      const res = await ax.post<WorkSchedule>(API_URL, data);
      setSchedules((prev) => [...prev, res.data]);
      return res.data;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  const updateSchedule = useCallback(async (id: number, data: Partial<WorkScheduleFormData>): Promise<WorkSchedule> => {
    setLoading(true);
    showLoading('Actualizando horario...');
    try {
      const ax = createAxiosInstance();
      const res = await ax.patch<WorkSchedule>(`${API_URL}${id}/`, data);
      setSchedules((prev) => prev.map((s) => (s.id === id ? res.data : s)));
      return res.data;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  const deleteSchedule = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    showLoading('Eliminando horario...');
    try {
      const ax = createAxiosInstance();
      await ax.delete(`${API_URL}${id}/`);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  // Guarda los 7 días de un empleado de una vez (crea o actualiza según exista)
  const saveEmployeeSchedules = useCallback(async (
    employeeId: number,
    daySchedules: Array<{ day_of_week: number; start_time: string; end_time: string; is_active: boolean }>
  ): Promise<WorkSchedule[]> => {
    setLoading(true);
    showLoading('Guardando horarios...');
    try {
      const ax = createAxiosInstance();
      const res = await ax.get<WorkSchedule[]>(`${API_URL}?employee=${employeeId}`);
      const existing = res.data;

      const results = await Promise.allSettled(
        daySchedules.map(async (day) => {
          const found = existing.find((s) => s.day_of_week === day.day_of_week);
          if (found) {
            const r = await ax.patch<WorkSchedule>(`${API_URL}${found.id}/`, day);
            return r.data;
          } else {
            const r = await ax.post<WorkSchedule>(API_URL, { employee: employeeId, ...day });
            return r.data;
          }
        })
      );

      const failed = results.filter((r) => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`${failed.length} día(s) no pudieron guardarse`);
      }

      const updated = await ax.get<WorkSchedule[]>(`${API_URL}?employee=${employeeId}`);
      setSchedules(updated.data);
      return updated.data;
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxiosInstance, showLoading, hideLoading]);

  return {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    saveEmployeeSchedules,
  };
};
