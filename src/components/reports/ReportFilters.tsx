// src/components/reports/ReportFilters.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './reportFilters.css';

// Tipos para los filtros
export interface DateRangeFilter {
  startDate: string;
  endDate: string;
}

export interface CategoryFilter {
  categoryId: number | null;
}

export interface EmployeeFilter {
  employeeId: number | null;
}

export interface ServiceFilter {
  serviceId: number | null;
}

export interface StatusFilter {
  status: string | null;
}

export interface PaymentMethodFilter {
  paymentMethod: string | null;
}

export interface ReportFilters {
  dateRange: DateRangeFilter;
  category?: CategoryFilter;
  employee?: EmployeeFilter;
  service?: ServiceFilter;
  status?: StatusFilter;
  paymentMethod?: PaymentMethodFilter;
}

interface FilterOption {
  id: number | string;
  name: string;
}

interface ReportFiltersProps {
  showCategoryFilter?: boolean;
  showEmployeeFilter?: boolean;
  showServiceFilter?: boolean;
  showStatusFilter?: boolean;
  showPaymentMethodFilter?: boolean;
  categoryOptions?: FilterOption[];
  employeeOptions?: FilterOption[];
  serviceOptions?: FilterOption[];
  statusOptions?: FilterOption[];
  initialFilters?: Partial<ReportFilters>;
  onFilterChange: (filters: ReportFilters) => void;
  // Dispara en tiempo real cuando el usuario cambia la categoría (antes de Apply)
  onCategoryChange?: (categoryId: number | null) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  showCategoryFilter = false,
  showEmployeeFilter = false,
  showServiceFilter = false,
  showStatusFilter = false,
  showPaymentMethodFilter = false,
  categoryOptions = [],
  employeeOptions = [],
  serviceOptions = [],
  statusOptions = [],
  initialFilters,
  onFilterChange,
  onCategoryChange,
}) => {
  // Crear valores por defecto
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Estado para los filtros
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd')
    },
    category: { categoryId: null },
    employee: { employeeId: null },
    service: { serviceId: null },
    status: { status: null },
    paymentMethod: { paymentMethod: null },
    ...initialFilters
  });
  
  // Cuando cambian los filtros iniciales
  useEffect(() => {
    if (initialFilters) {
      setFilters(prevFilters => ({ ...prevFilters, ...initialFilters }));
    }
  }, [initialFilters]);
  
  // Manejar cambios en los inputs de fecha
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newFilters = {
      ...filters,
      dateRange: {
        ...filters.dateRange,
        [field]: value
      }
    };
    setFilters(newFilters);
  };
  
  // Manejar cambios en filtros de selector
  const handleSelectChange = (
    filterType: 'category' | 'employee' | 'service' | 'status' | 'paymentMethod',
    value: string
  ) => {
    const numericValue = value ? Number(value) : null;

    let newFilters: ReportFilters;

    if (filterType === 'status') {
      newFilters = { ...filters, status: { status: value || null } };
    } else if (filterType === 'paymentMethod') {
      newFilters = { ...filters, paymentMethod: { paymentMethod: value || null } };
    } else if (filterType === 'category') {
      // Al cambiar categoría, limpiar servicio y empleado dependientes
      newFilters = {
        ...filters,
        category: { categoryId: numericValue },
        service: { serviceId: null },
        employee: { employeeId: null },
      };
      // Notificar al padre en tiempo real para que actualice las opciones dependientes
      onCategoryChange?.(numericValue);
    } else {
      newFilters = { ...filters, [filterType]: { [`${filterType}Id`]: numericValue } };
    }

    setFilters(newFilters);
  };
  
  // Enviar filtros al componente padre
  const applyFilters = () => {
    onFilterChange(filters);
  };
  
  // Resetear filtros a valores por defecto
  const resetFilters = () => {
    const defaultFilters: ReportFilters = {
      dateRange: {
        startDate: format(firstDayOfMonth, 'yyyy-MM-dd'),
        endDate: format(today, 'yyyy-MM-dd'),
      },
      category: { categoryId: null },
      employee: { employeeId: null },
      service: { serviceId: null },
      status: { status: null },
      paymentMethod: { paymentMethod: null },
    };

    setFilters(defaultFilters);
    onCategoryChange?.(null);
    onFilterChange(defaultFilters);
  };
  
  return (
    <div className="report-filters">
      <h3 className="filters-title">Filtros</h3>
      
      <div className="filters-form">
        <div className="filter-row">
          {/* Filtro de Rango de fechas - siempre visible */}
          <div className="filter-group date-filter">
            <label>Período</label>
            <div className="date-inputs">
              <input
                type="date"
                value={filters.dateRange.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="date-input"
              />
              <span>a</span>
              <input
                type="date"
                value={filters.dateRange.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="date-input"
              />
            </div>
          </div>
          
          {/* Filtro de Categoría */}
          {showCategoryFilter && (
            <div className="filter-group">
              <label>Categoría</label>
              <select
                value={filters.category?.categoryId?.toString() || ''}
                onChange={(e) => handleSelectChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">Todas las categorías</option>
                {categoryOptions.map(option => (
                  <option key={option.id} value={option.id.toString()}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        
        <div className="filter-row">
          {/* Filtro de Empleado */}
          {showEmployeeFilter && (
            <div className="filter-group">
              <label>Empleado</label>
              <select
                value={filters.employee?.employeeId?.toString() || ''}
                onChange={(e) => handleSelectChange('employee', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los empleados</option>
                {employeeOptions.map(option => (
                  <option key={option.id} value={option.id.toString()}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Filtro de Servicio */}
          {showServiceFilter && (
            <div className="filter-group">
              <label>Servicio</label>
              <select
                value={filters.service?.serviceId?.toString() || ''}
                onChange={(e) => handleSelectChange('service', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los servicios</option>
                {serviceOptions.map(option => (
                  <option key={option.id} value={option.id.toString()}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Filtro de Estado */}
          {showStatusFilter && (
            <div className="filter-group">
              <label>Estado</label>
              <select
                value={filters.status?.status || ''}
                onChange={(e) => handleSelectChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los estados</option>
                {statusOptions.map(option => (
                  <option key={option.id} value={option.id.toString()}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Medio de pago */}
          {showPaymentMethodFilter && (
            <div className="filter-group">
              <label>Medio de pago</label>
              <select
                value={filters.paymentMethod?.paymentMethod || ''}
                onChange={(e) => handleSelectChange('paymentMethod', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los medios</option>
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia</option>
                <option value="pos">POS</option>
              </select>
            </div>
          )}
        </div>
      </div>
      
      <div className="filter-actions">
        <button 
          className="reset-button" 
          onClick={resetFilters}
          type="button"
        >
          Restablecer
        </button>
        <button 
          className="apply-button" 
          onClick={applyFilters}
          type="button"
        >
          Aplicar filtros
        </button>
      </div>
    </div>
  );
};

export default ReportFilters;