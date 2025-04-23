// src/components/reports/ReportSummary.tsx
import React from 'react';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Clock } from 'lucide-react';
import './reportSummary.css';

// Define las métricas de resumen
export interface SummaryMetric {
  label: string;                // Etiqueta de la métrica
  value: string | number;       // Valor de la métrica
  previousValue?: string | number; // Valor anterior para comparación
  isPercentage?: boolean;       // Si es un porcentaje
  isCurrency?: boolean;         // Si es un valor monetario
  icon?: React.ReactNode;       // Icono opcional
  trend?: 'up' | 'down' | 'neutral'; // Tendencia
}

interface ReportSummaryProps {
  metrics: SummaryMetric[];
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ metrics }) => {
  // Función para formatear valores
  const formatValue = (metric: SummaryMetric): string => {
    const { value, isPercentage, isCurrency } = metric;
    
    if (isPercentage) {
      return `${value}%`;
    }
    
    if (isCurrency) {
      return typeof value === 'number'
        ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : `$${value}`;
    }
    
    return typeof value === 'number' ? value.toLocaleString() : String(value);
  };
  
  // Calcular el cambio porcentual
  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };
  
  // Obtener el texto de cambio
  const getChangeText = (metric: SummaryMetric): string => {
    if (metric.previousValue === undefined) return '';
    
    const current = typeof metric.value === 'number' ? metric.value : parseFloat(String(metric.value));
    const previous = typeof metric.previousValue === 'number' ? metric.previousValue : parseFloat(String(metric.previousValue));
    
    if (isNaN(current) || isNaN(previous)) return '';
    
    const change = calculateChange(current, previous);
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
  };
  
  // Determinar el CSS de cambio según la tendencia
  const getChangeClass = (metric: SummaryMetric): string => {
    if (metric.trend === 'up') return 'trend-up';
    if (metric.trend === 'down') return 'trend-down';
    return 'trend-neutral';
  };
  
  // Obtener el icono de tendencia
  const getTrendIcon = (metric: SummaryMetric): React.ReactNode => {
    if (metric.trend === 'up') return <TrendingUp size={16} />;
    if (metric.trend === 'down') return <TrendingDown size={16} />;
    return <Minus size={16} />;
  };
  
  // Obtener un icono predeterminado basado en el tipo de métrica
  const getDefaultIcon = (metric: SummaryMetric): React.ReactNode => {
    if (metric.isCurrency) return <DollarSign size={20} />;
    if (metric.label.toLowerCase().includes('servicio')) return <Users size={20} />;
    return <Clock size={20} />;
  };

  return (
    <div className="report-summary">
      {metrics.map((metric, index) => (
        <div key={index} className="summary-metric">
          <div className="metric-icon">
            {/* Usar el icono proporcionado o uno predeterminado */}
            {metric.icon || getDefaultIcon(metric)}
          </div>
          <div className="metric-content">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{formatValue(metric)}</div>
            {metric.previousValue !== undefined && (
              <div className={`metric-change ${getChangeClass(metric)}`}>
                <span className="trend-icon">{getTrendIcon(metric)}</span>
                {getChangeText(metric)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReportSummary;