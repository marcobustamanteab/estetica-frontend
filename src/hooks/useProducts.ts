/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';

type AxiosInstance = ReturnType<typeof axios.create>;

const API_BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL || 'https://estetica-backend-production.up.railway.app'
  : 'http://localhost:8000';

const BASE = `${API_BASE_URL}/api/products`;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  product_count: number;
}

export interface Product {
  id: number;
  business: number;
  category: number;
  category_name: string;
  name: string;
  description: string | null;
  sale_price: number;
  cost_price: number | null;
  min_stock: number;
  current_stock: number;
  is_low_stock: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MovementType = 'in' | 'out' | 'sale' | 'adjustment' | 'return';

export interface StockMovement {
  id: number;
  product: number;
  product_name: string;
  quantity: number;
  movement_type: MovementType;
  movement_type_display: string;
  unit_price: number | null;
  performed_by: number | null;
  performed_by_name: string | null;
  appointment: number | null;
  notes: string | null;
  created_at: string;
}

export interface ProductCategoryFormData {
  name: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ProductFormData {
  category: number;
  name: string;
  description?: string | null;
  sale_price: number;
  cost_price?: number | null;
  min_stock?: number;
  is_active?: boolean;
}

export interface StockMovementFormData {
  product: number;
  quantity: number;
  movement_type: MovementType;
  unit_price?: number | null;
  notes?: string | null;
  appointment?: number | null;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useProducts = () => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { logout } = useAuth();
  const { showLoading, hideLoading } = useLoading();

  const createAxios = useCallback((): AxiosInstance => {
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

  // ── Categories ──────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async (businessId?: number | null): Promise<ProductCategory[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando categorías...');
    try {
      const ax = createAxios();
      const url = businessId ? `${BASE}/categories/?business=${businessId}` : `${BASE}/categories/`;
      const res = await ax.get<ProductCategory[]>(url);
      setCategories(res.data);
      return res.data;
    } catch {
      setError('Error al cargar categorías');
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const createCategory = useCallback(async (data: ProductCategoryFormData): Promise<ProductCategory> => {
    showLoading('Creando categoría...');
    try {
      const ax = createAxios();
      const res = await ax.post<ProductCategory>(`${BASE}/categories/`, data);
      setCategories((prev) => [...prev, res.data]);
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const updateCategory = useCallback(async (id: number, data: ProductCategoryFormData): Promise<ProductCategory> => {
    showLoading('Actualizando categoría...');
    try {
      const ax = createAxios();
      const res = await ax.put<ProductCategory>(`${BASE}/categories/${id}/`, data);
      setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const deleteCategory = useCallback(async (id: number): Promise<void> => {
    showLoading('Eliminando categoría...');
    try {
      const ax = createAxios();
      await ax.delete(`${BASE}/categories/${id}/`);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const toggleCategoryStatus = useCallback(async (id: number, isActive: boolean): Promise<ProductCategory> => {
    showLoading('Actualizando estado...');
    try {
      const ax = createAxios();
      const res = await ax.patch<ProductCategory>(`${BASE}/categories/${id}/`, { is_active: !isActive });
      setCategories((prev) => prev.map((c) => (c.id === id ? res.data : c)));
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  // ── Products ─────────────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async (categoryId?: number, businessId?: number | null): Promise<Product[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando productos...');
    try {
      const ax = createAxios();
      const params = new URLSearchParams();
      if (categoryId) params.append('category', String(categoryId));
      if (businessId) params.append('business', String(businessId));
      const url = `${BASE}/${params.toString() ? '?' + params.toString() : ''}`;
      const res = await ax.get<Product[]>(url);
      setProducts(res.data);
      return res.data;
    } catch {
      setError('Error al cargar productos');
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const createProduct = useCallback(async (data: ProductFormData): Promise<Product> => {
    showLoading('Creando producto...');
    try {
      const ax = createAxios();
      const res = await ax.post<Product>(`${BASE}/`, data);
      setProducts((prev) => [...prev, res.data]);
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const updateProduct = useCallback(async (id: number, data: ProductFormData): Promise<Product> => {
    showLoading('Actualizando producto...');
    try {
      const ax = createAxios();
      const res = await ax.put<Product>(`${BASE}/${id}/`, data);
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const deleteProduct = useCallback(async (id: number): Promise<void> => {
    showLoading('Eliminando producto...');
    try {
      const ax = createAxios();
      await ax.delete(`${BASE}/${id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const toggleProductStatus = useCallback(async (id: number, isActive: boolean): Promise<Product> => {
    showLoading('Actualizando estado...');
    try {
      const ax = createAxios();
      const res = await ax.patch<Product>(`${BASE}/${id}/`, { is_active: !isActive });
      setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p)));
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  // ── Movements ────────────────────────────────────────────────────────────────

  const fetchMovements = useCallback(async (filters?: {
    product?: number;
    movement_type?: MovementType;
    performed_by?: number;
    date_from?: string;
    date_to?: string;
    businessId?: number | null;
  }): Promise<StockMovement[]> => {
    setLoading(true);
    setError(null);
    showLoading('Cargando movimientos...');
    try {
      const ax = createAxios();
      const params = new URLSearchParams();
      if (filters?.product) params.append('product', String(filters.product));
      if (filters?.movement_type) params.append('movement_type', filters.movement_type);
      if (filters?.performed_by) params.append('performed_by', String(filters.performed_by));
      if (filters?.date_from) params.append('date_from', filters.date_from);
      if (filters?.date_to) params.append('date_to', filters.date_to);
      if (filters?.businessId) params.append('business', String(filters.businessId));
      const url = `${BASE}/movements/${params.toString() ? '?' + params.toString() : ''}`;
      const res = await ax.get<StockMovement[]>(url);
      setMovements(res.data);
      return res.data;
    } catch {
      setError('Error al cargar movimientos');
      return [];
    } finally {
      setLoading(false);
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const createMovement = useCallback(async (data: StockMovementFormData): Promise<StockMovement> => {
    showLoading('Registrando movimiento...');
    try {
      const ax = createAxios();
      const res = await ax.post<StockMovement>(`${BASE}/movements/`, data);
      setMovements((prev) => [res.data, ...prev]);
      // Actualizar el stock del producto afectado en el estado local
      setProducts((prev) =>
        prev.map((p) =>
          p.id === data.product
            ? { ...p, current_stock: p.current_stock + data.quantity }
            : p
        )
      );
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  const fetchProductMovements = useCallback(async (productId: number): Promise<StockMovement[]> => {
    showLoading('Cargando historial...');
    try {
      const ax = createAxios();
      const res = await ax.get<StockMovement[]>(`${BASE}/${productId}/movements/`);
      return res.data;
    } finally {
      hideLoading();
    }
  }, [createAxios, showLoading, hideLoading]);

  return {
    categories,
    products,
    movements,
    loading,
    error,
    // Categories
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    // Products
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    // Movements
    fetchMovements,
    createMovement,
    fetchProductMovements,
  };
};
