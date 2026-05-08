// src/components/reports/ProductsReport.tsx
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import ReportFilters, { ReportFilters as FiltersType } from './ReportFilters';
import ReportSummary, { SummaryMetric } from './ReportSummary';
import DataTable from '../common/DataTable';
import { useProducts } from '../../hooks/useProducts';
import { useUsers } from '../../hooks/useUsers';
import { createColumnHelper } from '@tanstack/react-table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { BarChart2, Printer } from 'lucide-react';
import './salesReport.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SaleRow {
  id: number;
  date: string;
  formattedDate: string;
  product_id: number;
  product_name: string;
  category_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  performed_by_name: string;
  notes: string;
}

interface ChartPoint {
  label: string;
  revenue: number;
  units: number;
}

type ViewMode = 'chart' | 'table';
type ChartMode = 'by_date' | 'by_product';

// ─── Component ────────────────────────────────────────────────────────────────

const ProductsReport: React.FC = () => {
  const { products, movements, categories, fetchProducts, fetchMovements, fetchCategories } = useProducts();
  const { users: employees, fetchUsers } = useUsers();

  const [filters, setFilters] = useState<FiltersType>({
    dateRange: {
      startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
    },
    category: { categoryId: null },
    employee: { employeeId: null },
  });

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('chart');
  const [chartMode, setChartMode] = useState<ChartMode>('by_date');
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetric[]>([]);
  const [saleRows, setSaleRows] = useState<SaleRow[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);

  // ── Initial load ──
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchUsers(),
        fetchMovements({
          movement_type: 'sale',
          date_from: filters.dateRange.startDate,
          date_to: filters.dateRange.endDate,
        }),
      ]);
      setLoading(false);
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Process data when source or filters change ──
  useEffect(() => {
    if (movements.length === 0 && products.length === 0) {
      setSaleRows([]);
      setSummaryMetrics(emptyMetrics());
      setChartData([]);
      return;
    }

    // Build product → category map
    const productCatMap: Record<number, string> = {};
    products.forEach((p) => { productCatMap[p.id] = p.category_name; });

    // Filter movements to sales in date range
    let filtered = movements.filter((m) => {
      if (m.movement_type !== 'sale') return false;
      const d = m.created_at.slice(0, 10);
      return d >= filters.dateRange.startDate && d <= filters.dateRange.endDate;
    });

    // Category filter (via product lookup)
    if (activeCategoryId) {
      const prodIdsInCat = new Set(
        products.filter((p) => p.category === activeCategoryId).map((p) => p.id)
      );
      filtered = filtered.filter((m) => prodIdsInCat.has(m.product));
    }

    // Employee filter
    if (filters.employee?.employeeId) {
      filtered = filtered.filter((m) => m.performed_by === filters.employee?.employeeId);
    }

    // Build rows
    const rows: SaleRow[] = filtered.map((m) => {
      const qty = Math.abs(m.quantity);
      const price = m.unit_price ?? 0;
      return {
        id: m.id,
        date: m.created_at.slice(0, 10),
        formattedDate: (() => { try { return format(parseISO(m.created_at.slice(0, 10)), 'dd/MM/yyyy'); } catch { return m.created_at.slice(0, 10); } })(),
        product_id: m.product,
        product_name: m.product_name,
        category_name: productCatMap[m.product] ?? '—',
        quantity: qty,
        unit_price: price,
        total: qty * price,
        performed_by_name: m.performed_by_name ?? '—',
        notes: m.notes ?? '',
      };
    });

    setSaleRows(rows);
    calculateMetrics(rows);
    buildChart(rows, chartMode);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movements, products, filters, activeCategoryId, chartMode]);

  // ── Helpers ──

  function emptyMetrics(): SummaryMetric[] {
    return [
      { label: 'Total Vendido',      value: 0, isCurrency: true, trend: 'neutral' },
      { label: 'Unidades Vendidas',  value: 0, trend: 'neutral' },
      { label: 'Ticket Promedio',    value: 0, isCurrency: true, trend: 'neutral' },
      { label: 'Ganancia Estimada',  value: 0, isCurrency: true, trend: 'neutral' },
    ];
  }

  function calculateMetrics(rows: SaleRow[]) {
    const totalRevenue = rows.reduce((s, r) => s + r.total, 0);
    const totalUnits   = rows.reduce((s, r) => s + r.quantity, 0);
    const avgTicket    = rows.length > 0 ? totalRevenue / rows.length : 0;

    // Ganancia estimada: (sale_price - cost_price) * qty si hay costo cargado
    let estimatedProfit = 0;
    rows.forEach((r) => {
      const prod = products.find((p) => p.id === r.product_id);
      if (prod?.cost_price != null) {
        estimatedProfit += (r.unit_price - prod.cost_price) * r.quantity;
      }
    });

    setSummaryMetrics([
      { label: 'Total Vendido',     value: totalRevenue,      isCurrency: true, trend: 'neutral' },
      { label: 'Unidades Vendidas', value: totalUnits,        trend: 'neutral' },
      { label: 'Ticket Promedio',   value: avgTicket,         isCurrency: true, trend: 'neutral' },
      { label: 'Ganancia Estimada', value: estimatedProfit,   isCurrency: true, trend: 'neutral' },
    ]);
  }

  function buildChart(rows: SaleRow[], mode: ChartMode) {
    if (mode === 'by_date') {
      const byDate: Record<string, ChartPoint> = {};
      rows.forEach((r) => {
        if (!byDate[r.date]) byDate[r.date] = { label: r.formattedDate, revenue: 0, units: 0 };
        byDate[r.date].revenue += r.total;
        byDate[r.date].units   += r.quantity;
      });
      setChartData(Object.values(byDate).sort((a, b) => a.label.localeCompare(b.label)));
    } else {
      const byProduct: Record<string, ChartPoint> = {};
      rows.forEach((r) => {
        if (!byProduct[r.product_name]) byProduct[r.product_name] = { label: r.product_name, revenue: 0, units: 0 };
        byProduct[r.product_name].revenue += r.total;
        byProduct[r.product_name].units   += r.quantity;
      });
      setChartData(
        Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 15)
      );
    }
  }

  // ── Filter handlers ──

  const handleFilterChange = async (newFilters: FiltersType) => {
    setLoading(true);
    await fetchMovements({
      movement_type: 'sale',
      date_from: newFilters.dateRange.startDate,
      date_to: newFilters.dateRange.endDate,
    });
    setFilters(newFilters);
    setLoading(false);
  };

  // ── Filter options ──

  const categoryOptions = categories
    .filter((c) => c.is_active)
    .map((c) => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const employeeOptions = employees
    .filter((e) => !e.is_staff && e.is_active)
    .map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Table columns ──

  const colHelper = createColumnHelper<SaleRow>();
  const columns = [
    colHelper.accessor('formattedDate', { header: 'Fecha',     cell: (i) => i.getValue() }),
    colHelper.accessor('product_name',  { header: 'Producto',  cell: (i) => i.getValue() }),
    colHelper.accessor('category_name', { header: 'Categoría', cell: (i) => i.getValue() }),
    colHelper.accessor('quantity',      { header: 'Unidades',  cell: (i) => i.getValue() }),
    colHelper.accessor('unit_price', {
      header: 'Precio Unit.',
      cell: (i) => `$${Number(i.getValue()).toLocaleString()}`,
    }),
    colHelper.accessor('total', {
      header: 'Total',
      cell: (i) => (
        <span style={{ fontWeight: 700, color: '#0d9488' }}>
          ${Number(i.getValue()).toLocaleString()}
        </span>
      ),
    }),
    colHelper.accessor('performed_by_name', { header: 'Vendido por', cell: (i) => i.getValue() }),
    colHelper.accessor('notes', {
      header: 'Notas',
      cell: (i) => <span style={{ color: '#6b7280', fontSize: 12 }}>{i.getValue() || '—'}</span>,
    }),
  ];

  const exportColumns = [
    { header: 'Fecha',       accessor: 'formattedDate' },
    { header: 'Producto',    accessor: 'product_name' },
    { header: 'Categoría',   accessor: 'category_name' },
    { header: 'Unidades',    accessor: 'quantity' },
    { header: 'Precio Unit.', accessor: 'unit_price',
      formatFn: (v: number) => `$${v.toLocaleString()}` },
    { header: 'Total',       accessor: 'total',
      formatFn: (v: number) => `$${v.toLocaleString()}` },
    { header: 'Vendido por', accessor: 'performed_by_name' },
    { header: 'Notas',       accessor: 'notes' },
  ];

  // ── Render ──

  return (
    <div className="sales-report">
      <h3 className="report-title">Ventas de Productos</h3>

      <ReportFilters
        showCategoryFilter
        showEmployeeFilter
        categoryOptions={categoryOptions}
        employeeOptions={employeeOptions}
        initialFilters={filters}
        onFilterChange={handleFilterChange}
        onCategoryChange={setActiveCategoryId}
      />

      <ReportSummary metrics={summaryMetrics} />

      {/* View controls */}
      <div className="visualization-controls">
        <div className="view-toggles">
          <button
            className={`view-toggle ${viewMode === 'chart' ? 'active' : ''}`}
            onClick={() => setViewMode('chart')}
          >
            <BarChart2 size={18} /><span>Gráfico</span>
          </button>
          <button
            className={`view-toggle ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <Printer size={18} /><span>Tabla</span>
          </button>
        </div>

        {viewMode === 'chart' && (
          <div className="chart-types">
            <button
              className={`view-toggle ${chartMode === 'by_date' ? 'active' : ''}`}
              onClick={() => setChartMode('by_date')}
              title="Por fecha"
            >
              Por fecha
            </button>
            <button
              className={`view-toggle ${chartMode === 'by_product' ? 'active' : ''}`}
              onClick={() => setChartMode('by_product')}
              title="Por producto"
            >
              Por producto
            </button>
          </div>
        )}
      </div>

      <div className="report-visualization">
        {loading ? (
          <div className="loading-message"><p>Cargando datos...</p></div>
        ) : saleRows.length === 0 ? (
          <div className="empty-data-message">
            <p>No hay ventas de productos para el período seleccionado.</p>
          </div>
        ) : viewMode === 'chart' ? (
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  interval={chartMode === 'by_date' ? 'preserveStartEnd' : 0}
                  angle={chartMode === 'by_product' ? -30 : 0}
                  textAnchor={chartMode === 'by_product' ? 'end' : 'middle'}
                  height={chartMode === 'by_product' ? 60 : 30}
                />
                <YAxis yAxisId="left"  tickFormatter={(v) => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === 'revenue'
                      ? [`$${value.toLocaleString()}`, 'Ingresos']
                      : [value, 'Unidades']
                  }
                />
                <Legend formatter={(v) => v === 'revenue' ? 'Ingresos' : 'Unidades'} />
                <Bar yAxisId="left"  dataKey="revenue" name="revenue" fill="#0d9488" />
                <Bar yAxisId="right" dataKey="units"   name="units"   fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={saleRows}
            title="Detalle de ventas de productos"
            filterPlaceholder="Buscar producto, vendedor..."
            exportConfig={{ columns: exportColumns, fileName: 'ventas-productos' }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductsReport;
