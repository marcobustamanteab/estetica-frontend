/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/reports/EmployeesReport.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ReportFilters, { ReportFilters as FiltersType } from './ReportFilters';
import ReportSummary, { SummaryMetric } from './ReportSummary';
import DataTable from '../common/DataTable';
import { useAppointments } from '../../hooks/useAppointments';
import { useServices } from '../../hooks/useServices';
import { useUsers } from '../../hooks/useUsers';
import { createColumnHelper } from '@tanstack/react-table';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Printer, Download, BarChart2, PieChart as PieChartIcon } from 'lucide-react';
import './employeesReport.css';

// Tipo para los datos de rendimiento por empleado
interface EmployeePerformance {
  employeeId: number;
  employeeName: string;
  totalServiceCount: number;
  totalSales: number;
  averageServiceValue: number;
  servicesByCategory: {
    [categoryId: number]: {
      categoryName: string;
      count: number;
      total: number;
    }
  };
}

// Tipo para las vistas del reporte
type ReportView = 'chart' | 'table';

// Tipo para el tipo de gráfico
type ChartType = 'bar' | 'pie';

const EmployeesReport: React.FC = () => {
  // Hooks para obtener datos
  const { appointments, fetchAppointments } = useAppointments();
  const { services, categories, fetchServices, fetchCategories } = useServices();
  const { users: employees, fetchUsers } = useUsers();
  
  // Estado para los filtros aplicados
  const [filters, setFilters] = useState<FiltersType>({
    dateRange: {
      startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd')
    },
    employee: { employeeId: null },
    category: { categoryId: null }
  });
  
  // Estado para los datos de rendimiento procesados
  const [performanceData, setPerformanceData] = useState<EmployeePerformance[]>([]);
  
  // Estado para métricas de resumen
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);
  
  // Estado para la vista actual (gráfico o tabla)
  const [currentView, setCurrentView] = useState<ReportView>('chart');
  
  // Estado para el tipo de gráfico
  const [chartType, setChartType] = useState<ChartType>('bar');
  
  // Estado de carga
  const [loading, setLoading] = useState<boolean>(false);
  
  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchServices(),
        fetchCategories(),
        fetchUsers(),
        fetchAppointments({ 
          date_from: filters.dateRange.startDate, 
          date_to: filters.dateRange.endDate,
          status: 'completed' // Solo citas completadas para el reporte
        })
      ]);
      setLoading(false);
    };
    
    loadInitialData();
  }, []);
  
  // Procesar datos cuando cambian las citas o los filtros
  useEffect(() => {
    const processData = () => {
      if (appointments.length === 0 || services.length === 0 || employees.length === 0) {
        setPerformanceData([]);
        return;
      }
      
      // Filtrar citas según los filtros
      let filteredAppointments = appointments.filter(appointment => 
        appointment.status === 'completed' &&
        new Date(appointment.date) >= new Date(filters.dateRange.startDate) &&
        new Date(appointment.date) <= new Date(filters.dateRange.endDate)
      );
      
      // Aplicar filtro de empleado si está seleccionado
      if (filters.employee?.employeeId) {
        filteredAppointments = filteredAppointments.filter(appointment => 
          appointment.employee === filters.employee?.employeeId
        );
      }
      
      // Aplicar filtro de categoría si está seleccionado
      if (filters.category?.categoryId) {
        const servicesInCategory = services.filter(
          service => service.category === filters.category?.categoryId
        ).map(service => service.id);
        
        filteredAppointments = filteredAppointments.filter(appointment => 
          servicesInCategory.includes(appointment.service)
        );
      }
      
      // Agrupar datos por empleado
      const employeeData: Record<number, EmployeePerformance> = {};
      
      filteredAppointments.forEach(appointment => {
        const { employee, service } = appointment;
        const serviceData = services.find(s => s.id === service);
        if (!serviceData) return;
        
        // Obtener o inicializar datos del empleado
        if (!employeeData[employee]) {
          const employeeObj = employees.find(e => e.id === employee);
          const employeeName = employeeObj 
            ? `${employeeObj.first_name} ${employeeObj.last_name}`
            : `Empleado #${employee}`;
          
          employeeData[employee] = {
            employeeId: employee,
            employeeName,
            totalServiceCount: 0,
            totalSales: 0,
            averageServiceValue: 0,
            servicesByCategory: {}
          };
        }
        
        // Actualizar contadores generales
        employeeData[employee].totalServiceCount += 1;
        employeeData[employee].totalSales += serviceData.price;
        
        // Actualizar contadores por categoría
        const categoryId = serviceData.category;
        const categoryName = serviceData.category_name || 'Sin categoría';
        
        if (!employeeData[employee].servicesByCategory[categoryId]) {
          employeeData[employee].servicesByCategory[categoryId] = {
            categoryName,
            count: 0,
            total: 0
          };
        }
        
        employeeData[employee].servicesByCategory[categoryId].count += 1;
        employeeData[employee].servicesByCategory[categoryId].total += serviceData.price;
      });
      
      // Calcular promedios y convertir a array
      const processedData = Object.values(employeeData).map(empData => {
        empData.averageServiceValue = empData.totalServiceCount > 0 
          ? empData.totalSales / empData.totalServiceCount
          : 0;
        return empData;
      });
      
      // Ordenar por ventas totales (descendente)
      processedData.sort((a, b) => b.totalSales - a.totalSales);
      
      setPerformanceData(processedData);
      
      // Calcular métricas de resumen
      calculateSummaryMetrics(processedData);
    };
    
    processData();
  }, [appointments, services, employees, filters]);
  
  // Calcular métricas de resumen
  const calculateSummaryMetrics = (data: EmployeePerformance[]) => {
    // Si no hay datos, mostrar métricas vacías
    if (data.length === 0) {
      setSummaryMetrics([
        {
          label: 'Total de Ventas',
          value: 0,
          isCurrency: true,
          trend: 'neutral'
        },
        {
          label: 'Total de Servicios',
          value: 0,
          trend: 'neutral'
        },
        {
          label: 'Valor Promedio',
          value: 0,
          isCurrency: true,
          trend: 'neutral'
        }
      ]);
      return;
    }
    
    // Total de ventas
    const totalSales = data.reduce((sum, emp) => sum + emp.totalSales, 0);
    
    // Total de servicios
    const totalServices = data.reduce((sum, emp) => sum + emp.totalServiceCount, 0);
    
    // Valor promedio por servicio
    const averageServiceValue = totalServices > 0 ? totalSales / totalServices : 0;
    
    // Establecer las métricas
    setSummaryMetrics([
      {
        label: 'Total de Ventas',
        value: totalSales,
        isCurrency: true,
        trend: 'neutral'
      },
      {
        label: 'Total de Servicios',
        value: totalServices,
        trend: 'neutral'
      },
      {
        label: 'Valor Promedio',
        value: averageServiceValue,
        isCurrency: true,
        trend: 'neutral'
      }
    ]);
  };
  
  // Aplicar nuevos filtros
  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);
    
    // Recargar citas con el nuevo rango de fechas
    fetchAppointments({ 
      date_from: newFilters.dateRange.startDate, 
      date_to: newFilters.dateRange.endDate,
      status: 'completed'
    });
  };
  
  // Columnas para la tabla de datos
  const columnHelper = createColumnHelper<EmployeePerformance>();
  
  const columns = [
    columnHelper.accessor('employeeName', {
      header: 'Empleado',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('totalServiceCount', {
      header: 'Servicios Completados',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('totalSales', {
      header: 'Ventas Totales',
      cell: info => `$${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    }),
    columnHelper.accessor('averageServiceValue', {
      header: 'Valor Promedio',
      cell: info => `$${info.getValue().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    })
  ];
  
  // Exportar columnas para CSV, Excel, PDF
  const exportColumns = [
    { header: 'Empleado', accessor: 'employeeName' },
    { header: 'Servicios Completados', accessor: 'totalServiceCount' },
    { 
      header: 'Ventas Totales', 
      accessor: 'totalSales',
      formatFn: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    },
    { 
      header: 'Valor Promedio', 
      accessor: 'averageServiceValue',
      formatFn: (value: number) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  ];
  
  // Opciones para los filtros de categoría
  const categoryOptions = categories
    .map(category => ({ id: category.id, name: category.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Opciones para los filtros de empleado
  const employeeOptions = employees
    .map(employee => ({ 
      id: employee.id, 
      name: `${employee.first_name} ${employee.last_name}` 
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  
  // Cambiar la vista entre gráfico y tabla
  const toggleView = (view: ReportView) => {
    setCurrentView(view);
  };
  
  // Cambiar el tipo de gráfico
  const toggleChartType = (type: ChartType) => {
    setChartType(type);
  };
  
  // Renderizar los controles de visualización
  const renderVisControls = () => {
    return (
      <div className="visualization-controls">
        <div className="view-toggles">
          <button 
            className={`view-toggle ${currentView === 'chart' ? 'active' : ''}`}
            onClick={() => toggleView('chart')}
          >
            <BarChart2 size={18} />
            <span>Gráfico</span>
          </button>
          <button 
            className={`view-toggle ${currentView === 'table' ? 'active' : ''}`}
            onClick={() => toggleView('table')}
          >
            <Printer size={18} />
            <span>Tabla</span>
          </button>
        </div>
        
        {currentView === 'chart' && (
          <div className="chart-types">
            <button 
              className={`view-toggle ${chartType === 'bar' ? 'active' : ''}`}
              onClick={() => toggleChartType('bar')}
              title="Gráfico de Barras"
            >
              <BarChart2 size={18} />
            </button>
            <button 
              className={`view-toggle ${chartType === 'pie' ? 'active' : ''}`}
              onClick={() => toggleChartType('pie')}
              title="Gráfico Circular"
            >
              <PieChartIcon size={18} />
            </button>
          </div>
        )}
        
        {currentView === 'table' && (
          <div className="export-actions">
            <button className="export-action" title="Exportar">
              <Download size={18} />
              <span>Exportar</span>
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar el gráfico
  const renderChart = () => {
    if (performanceData.length === 0) {
      return (
        <div className="empty-data-message">
          <p>No hay datos de rendimiento para el período seleccionado.</p>
        </div>
      );
    }
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#0d9488', '#8884d8', '#82ca9d'];
    const height = 400;
    
    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {chartType === 'bar' ? (
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="employeeName" 
                height={50}
                interval={0}
                tick={(props) => {
                  const { x, y, payload } = props;
                  return (
                    <text
                      x={x}
                      y={y}
                      dy={10}
                      textAnchor="end"
                      transform={`rotate(-45, ${x}, ${y})`}
                      fontSize={12}
                    >
                      {payload.value}
                    </text>
                  );
                }}
              />
              <YAxis
                tickFormatter={(value: any) => `$${value}`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => {
                  if (name === 'totalSales' || name === 'averageServiceValue')
                    return [`$${Number(value).toLocaleString()}`, name === 'totalSales' ? 'Ventas Totales' : 'Valor Promedio'];
                  return [value, name === 'totalServiceCount' ? 'Servicios Completados' : name];
                }}
              />
              <Legend />
              <Bar 
                dataKey="totalSales" 
                name="Ventas Totales"
                fill="#0d9488" 
                animationDuration={500}
                isAnimationActive={true}
              />
              <Bar 
                dataKey="totalServiceCount" 
                name="Servicios Completados"
                fill="#8884d8" 
                animationDuration={500}
                isAnimationActive={true}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={performanceData}
                nameKey="employeeName"
                dataKey="totalSales"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                labelLine={true}
                label={({ name, percent }: { name: string; percent?: number }) => 
                  percent !== undefined ? `${name}: ${(percent * 100).toFixed(0)}%` : name
                }
              >
                {performanceData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any) => [`$${Number(value).toLocaleString()}`, 'Ventas']}
              />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };
  
  return (
    <div className="employees-report">
      <h3 className="report-title">Reporte de Rendimiento de Empleados</h3>
      
      {/* Filtros del reporte */}
      <ReportFilters
        showEmployeeFilter={true}
        showCategoryFilter={true}
        employeeOptions={employeeOptions}
        categoryOptions={categoryOptions}
        initialFilters={filters}
        onFilterChange={handleFilterChange}
      />
      
      {/* Métricas de resumen */}
      <ReportSummary metrics={summaryMetrics} />
      
      {/* Controles de visualización */}
      {renderVisControls()}
      
      {/* Contenido del reporte */}
      <div className="report-visualization">
        {loading ? (
          <div className="loading-message">
            <p>Cargando datos...</p>
          </div>
        ) : currentView === 'chart' ? (
          renderChart()
        ) : (
          <DataTable
            columns={columns}
            data={performanceData}
            title="Rendimiento por empleado"
            filterPlaceholder="Buscar por empleado..."
            exportConfig={{
              columns: exportColumns,
              fileName: "rendimiento-empleados"
            }}
          />
        )}
      </div>
    </div>
  );
};

export default EmployeesReport;