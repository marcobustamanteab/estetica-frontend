/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { useAppointments } from "../../hooks/useAppointments";
import { useServices } from "../../hooks/useServices";
import { useAuth } from "../../context/AuthContext";
import { DollarSign, Calendar, TrendingUp, Scissors } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import "./myEarningsReport.css";

type Period = "week" | "month";

const MyEarningsReport: React.FC = () => {
  const { currentUser } = useAuth();
  const { appointments, fetchAppointments } = useAppointments();
  const { services, fetchServices } = useServices();

  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(false);

  const commissionRate = (currentUser as any)?.commission_rate || 50;

  const getDateRange = (p: Period) => {
    const now = new Date();
    if (p === "week") {
      return {
        startDate: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    }
    return {
      startDate: format(startOfMonth(now), "yyyy-MM-dd"),
      endDate: format(endOfMonth(now), "yyyy-MM-dd"),
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const { startDate, endDate } = getDateRange(period);
      await Promise.all([
        fetchServices(),
        fetchAppointments({ date_from: startDate, date_to: endDate, status: "completed" }),
      ]);
      setLoading(false);
    };
    loadData();
  }, [period]);

  // Filtrar solo mis citas completadas
  const myAppointments = appointments.filter(
    (a) => a.employee === (currentUser as any)?.id && a.status === "completed"
  );

  const { startDate, endDate } = getDateRange(period);
  const filtered = myAppointments.filter(
    (a) => a.date >= startDate && a.date <= endDate
  );

  // Calcular ganancias
  const totalEarnings = filtered.reduce((sum, a) => {
    const service = services.find((s) => s.id === a.service);
    return sum + (service ? (service.price * commissionRate) / 100 : 0);
  }, 0);

  const totalServices = filtered.length;

  const avgEarning = totalServices > 0 ? totalEarnings / totalServices : 0;

  // Agrupar por servicio para el gráfico
  const serviceMap: Record<string, { name: string; count: number; earnings: number }> = {};
  filtered.forEach((a) => {
    const service = services.find((s) => s.id === a.service);
    if (!service) return;
    if (!serviceMap[service.id]) {
      serviceMap[service.id] = { name: service.name, count: 0, earnings: 0 };
    }
    serviceMap[service.id].count += 1;
    serviceMap[service.id].earnings += (service.price * commissionRate) / 100;
  });

  const chartData = Object.values(serviceMap).sort((a, b) => b.earnings - a.earnings);

  // Agrupar por día para tabla
  const byDay: Record<string, { date: string; count: number; earnings: number }> = {};
  filtered.forEach((a) => {
    if (!byDay[a.date]) byDay[a.date] = { date: a.date, count: 0, earnings: 0 };
    const service = services.find((s) => s.id === a.service);
    if (service) {
      byDay[a.date].count += 1;
      byDay[a.date].earnings += (service.price * commissionRate) / 100;
    }
  });
  const dayRows = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));

  const formatCLP = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`;

  return (
    <div className="my-earnings-report">
      {/* Header */}
      <div className="earnings-header">
        <h3>Mis Ganancias</h3>
        <div className="period-toggle">
          <button
            className={period === "week" ? "active" : ""}
            onClick={() => setPeriod("week")}
          >
            Esta Semana
          </button>
          <button
            className={period === "month" ? "active" : ""}
            onClick={() => setPeriod("month")}
          >
            Este Mes
          </button>
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
              <div className="earnings-card-icon green">
                <DollarSign size={22} />
              </div>
              <div>
                <div className="earnings-card-value">{formatCLP(totalEarnings)}</div>
                <div className="earnings-card-label">Total Ganancias</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon teal">
                <Calendar size={22} />
              </div>
              <div>
                <div className="earnings-card-value">{totalServices}</div>
                <div className="earnings-card-label">Servicios Completados</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon blue">
                <TrendingUp size={22} />
              </div>
              <div>
                <div className="earnings-card-value">{formatCLP(avgEarning)}</div>
                <div className="earnings-card-label">Promedio por Servicio</div>
              </div>
            </div>
            <div className="earnings-card">
              <div className="earnings-card-icon purple">
                <Scissors size={22} />
              </div>
              <div>
                <div className="earnings-card-value">{commissionRate}%</div>
                <div className="earnings-card-label">Tu Comisión</div>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="earnings-empty">
              <p>📅 No hay servicios completados en este período.</p>
            </div>
          ) : (
            <>
              {/* Chart */}
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

              {/* Table by day */}
              <div className="earnings-table-container">
                <h4>Detalle por Día</h4>
                <table className="earnings-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Servicios</th>
                      <th>Ganancias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayRows.map((row) => (
                      <tr key={row.date}>
                        <td>{format(new Date(row.date + "T00:00:00"), "dd/MM/yyyy")}</td>
                        <td>{row.count}</td>
                        <td style={{ fontWeight: 600, color: "#0d9488" }}>{formatCLP(row.earnings)}</td>
                      </tr>
                    ))}
                    <tr className="earnings-total-row">
                      <td><strong>Total</strong></td>
                      <td><strong>{totalServices}</strong></td>
                      <td><strong style={{ color: "#0d9488" }}>{formatCLP(totalEarnings)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default MyEarningsReport;