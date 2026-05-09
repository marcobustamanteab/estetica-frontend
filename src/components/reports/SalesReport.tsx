// src/components/reports/SalesReport.tsx
import React, { useState, useEffect } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import ReportFilters, { ReportFilters as FiltersType } from "./ReportFilters";
import ReportSummary, { SummaryMetric } from "./ReportSummary";
import DataTable from "../common/DataTable";
import { useAppointments, Appointment } from "../../hooks/useAppointments";
import { useServices } from "../../hooks/useServices";
import { useUsers } from "../../hooks/useUsers";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Printer, BarChart2, TrendingUp } from "lucide-react";
import "./salesReport.css";

// Tipo para los datos de ventas agrupados
interface SalesData {
  date: string;
  formattedDate: string;
  totalSales: number;
  serviceCount: number;
  services: {
    [serviceId: number]: {
      count: number;
      total: number;
    };
  };
  employees: {
    [employeeId: number]: {
      count: number;
      total: number;
    };
  };
}

// Tipo para las vistas del reporte
type ReportView = "chart" | "table";

const SalesReport: React.FC = () => {
  // Hooks para obtener datos
  const { appointments, fetchAppointments } = useAppointments();
  const { services, categories, fetchServices, fetchCategories } = useServices();
  const { users: employees, fetchUsers } = useUsers();

  // Estado para los filtros aplicados
  const [filters, setFilters] = useState<FiltersType>({
    dateRange: {
      startDate: format(
        new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        "yyyy-MM-dd"
      ),
      endDate: format(new Date(), "yyyy-MM-dd"),
    },
    category: { categoryId: null },
    employee: { employeeId: null },
    service: { serviceId: null },
  });

  // Estado para los datos de ventas procesados
  const [salesData, setSalesData] = useState<SalesData[]>([]);

  // Estado para métricas de resumen
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);

  // Estado para la vista actual (gráfico o tabla)
  const [currentView, setCurrentView] = useState<ReportView>("chart");

  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  // Ventas de productos para el período actual
  const [productRevenue, setProductRevenue] = useState<number>(0);
  // Totales de servicios — separados para poder combinar con productos en métricas
  const [serviceTotals, setServiceTotals] = useState({ sales: 0, count: 0, avgDaily: 0 });

  // Fetch ventas de productos para un rango — ventas suman, devoluciones restan (ingreso neto)
  const fetchProductRevenueFn = async (dateFrom: string, dateTo: string): Promise<number> => {
    const token = localStorage.getItem("access");
    if (!token) return 0;
    const apiBase = import.meta.env.PROD
      ? (import.meta.env.VITE_API_URL || "https://estetica-backend-production.up.railway.app")
      : "http://localhost:8000";
    try {
      const res = await fetch(
        `${apiBase}/api/products/movements/?date_from=${dateFrom}&date_to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return 0;
      const data: any[] = await res.json();
      return data.reduce((sum, m) => {
        const amount = Math.abs(m.quantity) * (m.unit_price || 0);
        if (m.movement_type === 'sale')   return sum + amount;
        if (m.movement_type === 'return') return sum - amount;
        return sum;
      }, 0);
    } catch {
      return 0;
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      const [,,,, prodRev] = await Promise.all([
        fetchServices(),
        fetchCategories(),
        fetchUsers(),
        fetchAppointments({
          date_from: filters.dateRange.startDate,
          date_to: filters.dateRange.endDate,
          status: "completed",
        }),
        fetchProductRevenueFn(filters.dateRange.startDate, filters.dateRange.endDate),
      ]);
      setProductRevenue(prodRev);
      setLoading(false);
    };

    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Procesar datos cuando cambian las citas o los filtros
  useEffect(() => {
    const processData = () => {
      if (appointments.length === 0 || services.length === 0) {
        setSalesData([]);
        return;
      }

      // Filtrar citas según los filtros
      let filteredAppointments = appointments.filter(
        (appointment) =>
          appointment.status === "completed" &&
          new Date(appointment.date) >= new Date(filters.dateRange.startDate) &&
          new Date(appointment.date) <= new Date(filters.dateRange.endDate)
      );

      // Aplicar filtro de servicio si está seleccionado
      if (filters.service?.serviceId) {
        filteredAppointments = filteredAppointments.filter(
          (appointment) => appointment.service === filters.service?.serviceId
        );
      }

      // Aplicar filtro de categoría si está seleccionado
      if (filters.category?.categoryId) {
        const servicesInCategory = services
          .filter(
            (service) => service.category === filters.category?.categoryId
          )
          .map((service) => service.id);

        filteredAppointments = filteredAppointments.filter((appointment) =>
          servicesInCategory.includes(appointment.service)
        );
      }

      // Aplicar filtro de empleado si está seleccionado
      if (filters.employee?.employeeId) {
        filteredAppointments = filteredAppointments.filter(
          (appointment) => appointment.employee === filters.employee?.employeeId
        );
      }

      // Agrupar ventas por fecha
      const salesByDate: Record<string, SalesData> = {};

      filteredAppointments.forEach((appointment) => {
        const { date, service, employee } = appointment;

        // Inicializar la fecha si no existe
        if (!salesByDate[date]) {
          salesByDate[date] = {
            date,
            formattedDate: format(parseISO(date), "dd/MM/yyyy"),
            totalSales: 0,
            serviceCount: 0,
            services: {},
            employees: {},
          };
        }

        // Encontrar el servicio correspondiente
        const serviceData = services.find((s) => s.id === service);
        if (!serviceData) return;

        // Actualizar totales generales
        salesByDate[date].serviceCount += 1;
        salesByDate[date].totalSales += serviceData.price;

        // Actualizar datos por servicio
        if (!salesByDate[date].services[service]) {
          salesByDate[date].services[service] = { count: 0, total: 0 };
        }
        salesByDate[date].services[service].count += 1;
        salesByDate[date].services[service].total += serviceData.price;

        // Actualizar datos por empleado
        if (!salesByDate[date].employees[employee]) {
          salesByDate[date].employees[employee] = { count: 0, total: 0 };
        }
        salesByDate[date].employees[employee].count += 1;
        salesByDate[date].employees[employee].total += serviceData.price;
      });

      // Convertir a array y ordenar por fecha
      const processedData = Object.values(salesByDate).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setSalesData(processedData);

      // Calcular métricas de resumen
      calculateSummaryMetrics(filteredAppointments);
    };

    processData();
  }, [appointments, services, filters]);

  // Calcular totales de servicios y almacenarlos — las métricas se arman en el useEffect combinado
  const calculateSummaryMetrics = (filteredAppointments: Appointment[]) => {
    const totalSales = filteredAppointments.reduce((sum, appointment) => {
      const service = services.find((s) => s.id === appointment.service);
      return sum + (service?.price || 0);
    }, 0);
    const totalServices = filteredAppointments.length;
    const days = differenceInDays(
      new Date(filters.dateRange.endDate),
      new Date(filters.dateRange.startDate)
    ) + 1;
    const averageDailySales = days > 0 ? totalSales / days : 0;
    setServiceTotals({ sales: totalSales, count: totalServices, avgDaily: averageDailySales });
  };

  // Métricas combinadas: servicios + productos — se recalculan cuando cambia cualquiera de los dos
  useEffect(() => {
    setSummaryMetrics([
      { label: "Ventas Servicios",    value: serviceTotals.sales,    isCurrency: true, trend: "neutral" },
      { label: "Servicios Realizados", value: serviceTotals.count,    trend: "neutral" },
      { label: "Promedio Diario",      value: serviceTotals.avgDaily, isCurrency: true, trend: "neutral" },
      { label: "Ventas Productos",     value: productRevenue,         isCurrency: true, trend: "neutral" },
      { label: "Total Combinado",      value: serviceTotals.sales + productRevenue, isCurrency: true, trend: "neutral" },
    ]);
  }, [serviceTotals, productRevenue]);

  // Aplicar nuevos filtros — fetch primero, luego actualizar filtros para evitar flash de datos vacíos
  const handleFilterChange = async (newFilters: FiltersType) => {
    setLoading(true);
    const [, prodRev] = await Promise.all([
      fetchAppointments({
        date_from: newFilters.dateRange.startDate,
        date_to: newFilters.dateRange.endDate,
        status: "completed",
      }),
      fetchProductRevenueFn(newFilters.dateRange.startDate, newFilters.dateRange.endDate),
    ]);
    setProductRevenue(prodRev);
    setFilters(newFilters);
    setLoading(false);
  };

  // Columnas para la tabla de datos
  const columnHelper = createColumnHelper<SalesData>();

  const columns = [
    columnHelper.accessor("formattedDate", {
      header: "Fecha",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("serviceCount", {
      header: "Servicios",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("totalSales", {
      header: "Total Ventas",
      cell: (info) =>
        `$${info.getValue().toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    }),
  ];

  // Exportar columnas para CSV, Excel, PDF
  const exportColumns = [
    { header: "Fecha", accessor: "formattedDate" },
    { header: "Servicios Completados", accessor: "serviceCount" },
    {
      header: "Total Ventas",
      accessor: "totalSales",
      formatFn: (value: number) =>
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
  ];

  const categoryOptions = categories
    .filter((c) => c.is_active)
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Servicios filtrados por la categoría activa en tiempo real
  const serviceOptions = (() => {
    const base = activeCategoryId
      ? services.filter((s) => s.category === activeCategoryId && s.is_active)
      : services.filter((s) => s.is_active);
    return base
      .map((s) => ({ id: s.id, name: s.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Empleados filtrados por la categoría activa en tiempo real
  const employeeOptions = (() => {
    let base = employees.filter((e) => !e.is_staff && e.is_active);
    if (activeCategoryId) {
      const selectedCat = categories.find((c) => c.id === activeCategoryId);
      if (selectedCat?.allowed_roles && selectedCat.allowed_roles.length > 0) {
        const allowedIds = new Set(selectedCat.allowed_roles.map((r) => r.id));
        base = base.filter((emp) => {
          if (!emp.groups || emp.groups.length === 0) return false;
          return emp.groups.some((g) => allowedIds.has(typeof g === "object" ? g.id : g));
        });
      }
    }
    return base
      .map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  // Cambiar la vista entre gráfico y tabla
  const toggleView = (view: ReportView) => {
    setCurrentView(view);
  };

  // Renderizar los controles de visualización
  const renderVisControls = () => {
    return (
      <div className="visualization-controls">
        <div className="view-toggles">
          <button
            className={`view-toggle ${currentView === "chart" ? "active" : ""}`}
            onClick={() => toggleView("chart")}
          >
            <BarChart2 size={18} />
            <span>Gráfico</span>
          </button>
          <button
            className={`view-toggle ${currentView === "table" ? "active" : ""}`}
            onClick={() => toggleView("table")}
          >
            <Printer size={18} />
            <span>Tabla</span>
          </button>
        </div>

        {currentView === "chart" && (
          <div className="chart-types">
            <button
              className={`view-toggle ${chartType === "bar" ? "active" : ""}`}
              onClick={() => setChartType("bar")}
              title="Gráfico de Barras"
            >
              <BarChart2 size={18} />
            </button>
            <button
              className={`view-toggle ${chartType === "line" ? "active" : ""}`}
              onClick={() => setChartType("line")}
              title="Gráfico de Líneas"
            >
              <TrendingUp size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar el gráfico
  const renderChart = () => {
    if (salesData.length === 0) {
      return (
        <div className="empty-data-message">
          <p>No hay datos de ventas para el período seleccionado.</p>
        </div>
      );
    }

    const height = 400;

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {chartType === "bar" ? (
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedDate"
                height={50}
                interval="preserveStartEnd"
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "Ventas",
                ]}
              />
              <Legend />
              <Bar
                dataKey="totalSales"
                name="Ventas Totales"
                fill="#0d9488"
                animationDuration={500}
                isAnimationActive={true}
              />
            </BarChart>
          ) : (
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="formattedDate"
                height={50}
                interval="preserveStartEnd"
                tick={{ fontSize: 12 }}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "Ventas",
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="totalSales"
                name="Ventas Totales"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={500}
                isAnimationActive={true}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="sales-report">
      <h3 className="report-title">Reporte de Ventas por Período</h3>

      {/* Filtros del reporte */}
      <ReportFilters
        showCategoryFilter={true}
        showEmployeeFilter={true}
        showServiceFilter={true}
        categoryOptions={categoryOptions}
        employeeOptions={employeeOptions}
        serviceOptions={serviceOptions}
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        onCategoryChange={setActiveCategoryId}
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
        ) : currentView === "chart" ? (
          renderChart()
        ) : (
          <DataTable
            columns={columns}
            data={salesData}
            title="Ventas por fecha"
            filterPlaceholder="Buscar por fecha..."
            exportConfig={{
              columns: exportColumns,
              fileName: "reporte-ventas",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default SalesReport;
