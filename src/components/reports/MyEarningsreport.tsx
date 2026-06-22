/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useAppointments } from "../../hooks/useAppointments";
import { useServices } from "../../hooks/useServices";
import { useAuth } from "../../context/AuthContext";
import { DollarSign, Calendar, TrendingUp, Scissors } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import ExportData from "../common/ExportData";
import { ExportColumn } from "../../types/ExportColumn";
import "./myEarningsReport.css";

type PeriodMode = "week" | "month" | "custom";

const today = () => format(new Date(), "yyyy-MM-dd");
const thisWeekStart = () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
const thisWeekEnd   = () => format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
const thisMonthStart = () => format(startOfMonth(new Date()), "yyyy-MM-dd");
const thisMonthEnd   = () => format(endOfMonth(new Date()), "yyyy-MM-dd");

const MyEarningsReport: React.FC = () => {
  const { currentUser } = useAuth();
  const { appointments, fetchAppointments } = useAppointments();
  const { services, fetchServices } = useServices();

  const [periodMode, setPeriodMode] = useState<PeriodMode>("month");
  const [customStart, setCustomStart] = useState(thisMonthStart());
  const [customEnd, setCustomEnd]     = useState(today());
  const [appliedStart, setAppliedStart] = useState(thisMonthStart());
  const [appliedEnd, setAppliedEnd]     = useState(thisMonthEnd());
  const [loading, setLoading] = useState(false);

  const commissionRate: number = (currentUser as any)?.commission_rate || 50;

  const loadData = async (start: string, end: string) => {
    setLoading(true);
    await Promise.all([
      fetchServices(),
      fetchAppointments({ date_from: start, date_to: end, status: "completed" }),
    ]);
    setLoading(false);
  };

  // Carga inicial
  useEffect(() => {
    loadData(appliedStart, appliedEnd);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePeriodChange = (mode: PeriodMode) => {
    setPeriodMode(mode);
    if (mode === "week") {
      const s = thisWeekStart(), e = thisWeekEnd();
      setAppliedStart(s); setAppliedEnd(e);
      loadData(s, e);
    } else if (mode === "month") {
      const s = thisMonthStart(), e = thisMonthEnd();
      setAppliedStart(s); setAppliedEnd(e);
      loadData(s, e);
    }
    // "custom" no dispara fetch hasta que el usuario haga clic en Aplicar
  };

  const handleApplyCustom = () => {
    if (customStart > customEnd) return;
    setAppliedStart(customStart);
    setAppliedEnd(customEnd);
    loadData(customStart, customEnd);
  };

  // Mis citas completadas en el rango aplicado
  const myAppointments = appointments.filter(
    (a) =>
      a.employee === (currentUser as any)?.id &&
      a.status === "completed" &&
      a.date >= appliedStart &&
      a.date <= appliedEnd
  );

  // Métricas
  const totalEarnings = myAppointments.reduce((sum, a) => {
    const svc = services.find((s) => s.id === a.service);
    return sum + (svc ? (Number(svc.price) * commissionRate) / 100 : 0);
  }, 0);
  const totalServices = myAppointments.length;
  const avgEarning = totalServices > 0 ? totalEarnings / totalServices : 0;

  // Ganancias por servicio (para el gráfico)
  const serviceMap: Record<string, { name: string; count: number; earnings: number }> = {};
  myAppointments.forEach((a) => {
    const svc = services.find((s) => s.id === a.service);
    if (!svc) return;
    const key = String(svc.id);
    if (!serviceMap[key]) serviceMap[key] = { name: svc.name, count: 0, earnings: 0 };
    serviceMap[key].count += 1;
    serviceMap[key].earnings += (Number(svc.price) * commissionRate) / 100;
  });
  const chartData = Object.values(serviceMap).sort((a, b) => b.earnings - a.earnings);

  // Detalle por atención (tabla)
  const detailRows = [...myAppointments]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((a) => {
      const svc = services.find((s) => s.id === a.service);
      const price = svc ? Number(svc.price) : 0;
      return {
        id: a.id,
        date: a.date,
        service: a.service_name,
        client: a.client_name,
        price,
        earning: (price * commissionRate) / 100,
      };
    });

  const formatCLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

  const exportColumns: ExportColumn[] = [
    {
      header: "Fecha",
      accessor: "date",
      formatFn: (v) => format(parseISO(v + "T00:00:00"), "dd/MM/yyyy"),
    },
    { header: "Servicio",     accessor: "service" },
    { header: "Cliente",      accessor: "client" },
    {
      header: "Precio Base",
      accessor: "price",
      formatFn: (v) => formatCLP(v),
    },
    {
      header: `Ganancia (${commissionRate}%)`,
      accessor: "earning",
      formatFn: (v) => formatCLP(v),
    },
  ];

  const periodLabel = periodMode === "week"
    ? "Esta semana"
    : periodMode === "month"
    ? "Este mes"
    : `${format(parseISO(appliedStart), "d MMM", { locale: es })} – ${format(parseISO(appliedEnd), "d MMM yyyy", { locale: es })}`;

  return (
    <div className="my-earnings-report">

      {/* Header + filtros */}
      <div className="earnings-header">
        <div>
          <h3>Mis Ganancias</h3>
          <p className="earnings-period-label">{periodLabel}</p>
        </div>
        <div className="earnings-filters">
          <div className="period-toggle">
            {(["week", "month", "custom"] as PeriodMode[]).map((m) => (
              <button
                key={m}
                className={periodMode === m ? "active" : ""}
                onClick={() => handlePeriodChange(m)}
              >
                {m === "week" ? "Semana" : m === "month" ? "Mes" : "Personalizado"}
              </button>
            ))}
          </div>
          {periodMode === "custom" && (
            <div className="earnings-custom-range">
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="earnings-date-input"
              />
              <span className="earnings-range-sep">a</span>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="earnings-date-input"
              />
              <button
                className="earnings-apply-btn"
                onClick={handleApplyCustom}
                disabled={customStart > customEnd}
              >
                Aplicar
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="earnings-loading">
          <div className="spinner" />
          <p>Cargando datos...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="earnings-cards">
            <div className="earnings-card">
              <div className="earnings-card-icon green"><DollarSign size={22} /></div>
              <div>
                <div className="earnings-card-value">{formatCLP(totalEarnings)}</div>
                <div className="earnings-card-label">Total Ganancias</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon teal"><Calendar size={22} /></div>
              <div>
                <div className="earnings-card-value">{totalServices}</div>
                <div className="earnings-card-label">Servicios Completados</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon blue"><TrendingUp size={22} /></div>
              <div>
                <div className="earnings-card-value">{formatCLP(avgEarning)}</div>
                <div className="earnings-card-label">Promedio por Servicio</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon purple"><Scissors size={22} /></div>
              <div>
                <div className="earnings-card-value">{commissionRate}%</div>
                <div className="earnings-card-label">Tu Comisión</div>
              </div>
            </div>
          </div>

          {myAppointments.length === 0 ? (
            <div className="earnings-empty">
              <p>📅 No hay servicios completados en este período.</p>
            </div>
          ) : (
            <>
              {/* Gráfico por servicio */}
              <div className="earnings-chart-container">
                <h4>Ganancias por Servicio</h4>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" />
                    <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => formatCLP(v)} />
                    <Bar dataKey="earnings" fill="#0d9488" radius={[4, 4, 0, 0]} name="Ganancias" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Tabla de detalle por atención */}
              <div className="earnings-table-container">
                <div className="earnings-table-header">
                  <h4>Detalle de Atenciones</h4>
                  <ExportData
                    data={detailRows}
                    columns={exportColumns}
                    fileName={`mis-ganancias-${appliedStart}-${appliedEnd}`}
                    title={`Mis Ganancias — ${periodLabel}`}
                    showCSV={false}
                  />
                </div>
                <div className="earnings-table-wrap">
                  <table className="earnings-table">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Servicio</th>
                        <th>Cliente</th>
                        <th>Precio base</th>
                        <th>Tu ganancia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.map((row) => (
                        <tr key={row.id}>
                          <td>{format(parseISO(row.date + "T00:00:00"), "dd/MM/yyyy")}</td>
                          <td>{row.service}</td>
                          <td className="earnings-client-name">{row.client}</td>
                          <td>{formatCLP(row.price)}</td>
                          <td className="earnings-highlight">{formatCLP(row.earning)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="earnings-total-row">
                        <td colSpan={3}><strong>Total ({totalServices} atenciones)</strong></td>
                        <td>—</td>
                        <td><strong className="earnings-highlight">{formatCLP(totalEarnings)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyEarningsReport;
