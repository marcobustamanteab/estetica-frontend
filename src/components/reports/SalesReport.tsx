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
import { Printer, BarChart2 } from "lucide-react";
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
  const { services, fetchServices } = useServices();
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

  // Estado para el tipo de gráfico (barra o línea)
  const [chartType] = useState<"bar" | "line">("bar");

  // Estado de carga
  const [loading, setLoading] = useState<boolean>(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchServices(),
        fetchUsers(),
        fetchAppointments({
          date_from: filters.dateRange.startDate,
          date_to: filters.dateRange.endDate,
          status: "completed", // Solo citas completadas para el reporte de ventas
        }),
      ]);
      setLoading(false);
    };

    loadInitialData();
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

  // Calcular métricas de resumen
  const calculateSummaryMetrics = (filteredAppointments: Appointment[]) => {
    // Total de ventas
    const totalSales = filteredAppointments.reduce((sum, appointment) => {
      const service = services.find((s) => s.id === appointment.service);
      return sum + (service?.price || 0);
    }, 0);

    // Total de servicios
    const totalServices = filteredAppointments.length;

    // Promedio diario de ventas
    const days =
      differenceInDays(
        new Date(filters.dateRange.endDate),
        new Date(filters.dateRange.startDate)
      ) + 1;

    const averageDailySales = days > 0 ? totalSales / days : 0;

    // Establecer las métricas de resumen
    setSummaryMetrics([
      {
        label: "Total de Ventas",
        value: totalSales,
        isCurrency: true,
        trend: "neutral",
      },
      {
        label: "Servicios Completados",
        value: totalServices,
        trend: "neutral",
      },
      {
        label: "Promedio Diario",
        value: averageDailySales,
        isCurrency: true,
        trend: "neutral",
      },
    ]);
  };

  // Aplicar nuevos filtros
  const handleFilterChange = (newFilters: FiltersType) => {
    setFilters(newFilters);

    // Recargar citas con el nuevo rango de fechas
    fetchAppointments({
      date_from: newFilters.dateRange.startDate,
      date_to: newFilters.dateRange.endDate,
      status: "completed",
    });
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

  // Opciones para los filtros de categoría
  const categoryOptions = services
    .reduce((unique: { id: number; name: string }[], service) => {
      const exists = unique.some((item) => item.id === service.category);
      if (!exists) {
        const categoryName = service.category_name;
        if (categoryName) {
          unique.push({ id: service.category, name: categoryName });
        }
      }
      return unique;
    }, [])
    .sort((a, b) => a.name.localeCompare(b.name));

  // Opciones para los filtros de servicio
  const serviceOptions = services
    .map((service) => ({ id: service.id, name: service.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Opciones para los filtros de empleado
  const employeeOptions = employees
    .filter((employee) => !employee.is_staff && employee.is_active)
    .map((employee) => ({
      id: employee.id,
      name: `${employee.first_name} ${employee.last_name}`,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

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
