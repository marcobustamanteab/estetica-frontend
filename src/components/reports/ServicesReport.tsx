import { useState, useEffect } from "react";
import { format } from "date-fns";
import ReportFilters, { ReportFilters as FiltersType } from "./ReportFilters";
import ReportSummary, { SummaryMetric } from "./ReportSummary";
import DataTable from "../common/DataTable";
import { useAppointments } from "../../hooks/useAppointments";
import { useServices } from "../../hooks/useServices";
import { createColumnHelper } from "@tanstack/react-table";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Printer,
  BarChart2,
  PieChart as PieChartIcon,
  DollarSign,
  Layers,
  Tag,
} from "lucide-react";
import "./servicesReport.css";

// Tipo para los datos de servicios populares
interface ServicePopularity {
  serviceId: number;
  serviceName: string;
  categoryId: number;
  categoryName: string;
  count: number;
  revenue: number;
  averageRevenue: number;
  percentageOfTotal: number;
}

// Tipo para las vistas del reporte
type ReportView = "chart" | "table";

// Tipo para el tipo de gráfico
type ChartType = "bar" | "pie";

const ServicesReport: React.FC = () => {
  // Hooks para obtener datos
  const { appointments, fetchAppointments } = useAppointments();
  const { services, categories, fetchServices, fetchCategories } = useServices();

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
  });

  // Estado para los datos de servicios procesados
  const [servicesData, setServicesData] = useState<ServicePopularity[]>([]);

  // Estado para métricas de resumen
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);

  // Estado para la vista actual (gráfico o tabla)
  const [currentView, setCurrentView] = useState<ReportView>("chart");

  // Estado para el tipo de gráfico
  const [chartType, setChartType] = useState<ChartType>("bar");

  // Estado de carga
  const [loading, setLoading] = useState<boolean>(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        fetchServices(),
        fetchCategories(),
        fetchAppointments({
          date_from: filters.dateRange.startDate,
          date_to: filters.dateRange.endDate,
          status: "completed",
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
        setServicesData([]);
        return;
      }

      // Filtrar citas según los filtros
      let filteredAppointments = appointments.filter(
        (appointment) =>
          appointment.status === "completed" &&
          new Date(appointment.date) >= new Date(filters.dateRange.startDate) &&
          new Date(appointment.date) <= new Date(filters.dateRange.endDate)
      );

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

      // Contar servicios y calcular ingresos
      const serviceCounts: Record<
        number,
        {
          count: number;
          revenue: number;
        }
      > = {};

      // Total de ingresos para calcular porcentajes
      let totalRevenue = 0;

      // Procesar cada cita
      filteredAppointments.forEach((appointment) => {
        const { service } = appointment;
        const serviceData = services.find((s) => s.id === service);
        if (!serviceData) return;

        if (!serviceCounts[service]) {
          serviceCounts[service] = {
            count: 0,
            revenue: 0,
          };
        }

        serviceCounts[service].count += 1;
        serviceCounts[service].revenue += serviceData.price;
        totalRevenue += serviceData.price;
      });

      // Convertir a array y añadir datos adicionales
      const processedData: ServicePopularity[] = Object.entries(
        serviceCounts
      ).map(([serviceId, { count, revenue }]) => {
        const serviceObj = services.find((s) => s.id === Number(serviceId));
        if (!serviceObj) {
          return {
            serviceId: Number(serviceId),
            serviceName: `Servicio #${serviceId}`,
            categoryId: 0,
            categoryName: "Desconocido",
            count,
            revenue,
            averageRevenue: revenue / count,
            percentageOfTotal:
              totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
          };
        }

        // Obtener categoría
        const category = categories.find((c) => c.id === serviceObj.category);

        return {
          serviceId: Number(serviceId),
          serviceName: serviceObj.name,
          categoryId: serviceObj.category,
          categoryName: category?.name || "Sin categoría",
          count,
          revenue,
          averageRevenue: revenue / count,
          percentageOfTotal:
            totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
        };
      });

      // Ordenar por ingresos (descendente)
      processedData.sort((a, b) => b.revenue - a.revenue);

      setServicesData(processedData);

      // Calcular métricas de resumen
      calculateSummaryMetrics(processedData, totalRevenue);
    };

    processData();
  }, [appointments, services, categories, filters]);

  // Calcular métricas de resumen
  const calculateSummaryMetrics = (
    data: ServicePopularity[],
    totalRevenue: number
  ) => {
    // Si no hay datos, mostrar métricas vacías
    if (data.length === 0) {
      setSummaryMetrics([
        {
          label: "Total de Ingresos",
          value: 0,
          isCurrency: true,
          trend: "neutral",
          icon: <DollarSign size={20} />,
        },
        {
          label: "Servicios Realizados",
          value: 0,
          trend: "neutral",
          icon: <Layers size={20} />,
        },
        {
          label: "Servicios Distintos",
          value: 0,
          trend: "neutral",
          icon: <Tag size={20} />,
        },
      ]);
      return;
    }

    // Total de servicios realizados
    const totalServicesCount = data.reduce(
      (sum, service) => sum + service.count,
      0
    );

    // Cantidad de servicios diferentes
    const uniqueServicesCount = data.length;

    // Establecer las métricas
    setSummaryMetrics([
      {
        label: "Total de Ingresos",
        value: totalRevenue,
        isCurrency: true,
        trend: "neutral",
        icon: <DollarSign size={20} />,
      },
      {
        label: "Servicios Realizados",
        value: totalServicesCount,
        trend: "neutral",
        icon: <Layers size={20} />,
      },
      {
        label: "Servicios Distintos",
        value: uniqueServicesCount,
        trend: "neutral",
        icon: <Tag size={20} />,
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
  const columnHelper = createColumnHelper<ServicePopularity>();

  const columns = [
    columnHelper.accessor("serviceName", {
      header: "Servicio",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("categoryName", {
      header: "Categoría",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("count", {
      header: "Cantidad",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("revenue", {
      header: "Ingresos",
      cell: (info) =>
        `$${info
          .getValue()
          .toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
    }),
    columnHelper.accessor("averageRevenue", {
      header: "Precio Promedio",
      cell: (info) =>
        `$${info
          .getValue()
          .toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
    }),
    columnHelper.accessor("percentageOfTotal", {
      header: "% del Total",
      cell: (info) => `${info.getValue().toFixed(1)}%`,
    }),
  ];

  // Exportar columnas para CSV, Excel, PDF
  const exportColumns = [
    { header: "Servicio", accessor: "serviceName" },
    { header: "Categoría", accessor: "categoryName" },
    { header: "Cantidad", accessor: "count" },
    {
      header: "Ingresos",
      accessor: "revenue",
      formatFn: (value: number) =>
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      header: "Precio Promedio",
      accessor: "averageRevenue",
      formatFn: (value: number) =>
        `$${value.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
    },
    {
      header: "% del Total",
      accessor: "percentageOfTotal",
      formatFn: (value: number) => `${value.toFixed(1)}%`,
    },
  ];

  // Opciones para los filtros de categoría
  const categoryOptions = categories
    .map((category) => ({ id: category.id, name: category.name }))
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
              onClick={() => toggleChartType("bar")}
              title="Gráfico de Barras"
            >
              <BarChart2 size={18} />
            </button>
            <button
              className={`view-toggle ${chartType === "pie" ? "active" : ""}`}
              onClick={() => toggleChartType("pie")}
              title="Gráfico Circular"
            >
              <PieChartIcon size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renderizar el gráfico
  const renderChart = () => {
    if (servicesData.length === 0) {
      return (
        <div className="empty-data-message">
          <p>No hay datos de servicios para el período seleccionado.</p>
        </div>
      );
    }

    // Limitar a los 10 servicios más populares para el gráfico
    const chartData = servicesData.slice(0, 10);

    const COLORS = [
      "#0088FE",
      "#00C49F",
      "#FFBB28",
      "#FF8042",
      "#0d9488",
      "#8884d8",
      "#82ca9d",
    ];
    const height = 400;

    return (
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={height}>
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="serviceName"
                height={80}
                interval={0}
                angle={0}
                textAnchor="middle"
                tick={{ fontSize: 11, fill: "#666" }}
                tickFormatter={(value) => {
                  // Truncar nombres largos para evitar superposición
                  const maxLength = 20;
                  return value.length > maxLength
                    ? value.substring(0, maxLength) + "..."
                    : value;
                }}
              />
              <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                formatter={(value, name) => {
                  if (name === "revenue")
                    return [`$${Number(value).toLocaleString()}`, "Ingresos"];
                  if (name === "count") return [value, "Cantidad"];
                  return [value, name];
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Ingresos"
                fill="#0d9488"
                animationDuration={500}
                isAnimationActive={true}
              />
              <Bar
                yAxisId="right"
                dataKey="count"
                name="Cantidad"
                fill="#8884d8"
                animationDuration={500}
                isAnimationActive={true}
              />
            </BarChart>
          ) : (
            <PieChart>
              <Pie
                data={chartData}
                nameKey="serviceName"
                dataKey="revenue"
                cx="50%"
                cy="50%"
                outerRadius={120}
                fill="#8884d8"
                labelLine={true}
                label={({ name, percent }) =>
                  percent > 0
                    ? `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                    : name
                }
              >
                {chartData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `$${Number(value).toLocaleString()}`,
                  "Ingresos",
                ]}
              />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="services-report">
      <h3 className="report-title">Reporte de Servicios Populares</h3>

      {/* Filtros del reporte */}
      <ReportFilters
        showCategoryFilter={true}
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
        ) : currentView === "chart" ? (
          renderChart()
        ) : (
          <DataTable
            columns={columns}
            data={servicesData}
            title="Servicios más populares"
            filterPlaceholder="Buscar por servicio..."
            exportConfig={{
              columns: exportColumns,
              fileName: "servicios-populares",
            }}
          />
        )}
      </div>
    </div>
  );
};

export default ServicesReport;
