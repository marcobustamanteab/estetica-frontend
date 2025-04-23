// src/components/reports/ReportSelector.tsx
import React from 'react';
import { ReportType } from '../../pages/Reports/ReportsPage';
import { BarChart, PieChart, User } from 'lucide-react';
import './reportSelector.css';

interface ReportSelectorProps {
  selectedReport: ReportType;
  onSelectReport: (reportType: ReportType) => void;
}

// Definición de los reportes disponibles
const availableReports = [
  {
    type: 'sales' as ReportType,
    name: 'Ventas por Período',
    description: 'Analiza las ventas realizadas en un período específico',
    icon: <BarChart size={24} />
  },
  {
    type: 'services' as ReportType,
    name: 'Servicios Populares',
    description: 'Identifica los servicios más solicitados y rentables',
    icon: <PieChart size={24} />
  },
  {
    type: 'employees' as ReportType,
    name: 'Rendimiento de Empleados',
    description: 'Evalúa la productividad de cada empleado',
    icon: <User size={24} />
  }
];

const ReportSelector: React.FC<ReportSelectorProps> = ({ 
  selectedReport, 
  onSelectReport 
}) => {
  return (
    <div className="report-selector">
      <h3 className="selector-title">Selecciona un reporte</h3>
      
      <div className="report-cards">
        {availableReports.map(report => (
          <div 
            key={report.type}
            className={`report-card ${selectedReport === report.type ? 'selected' : ''}`}
            onClick={() => onSelectReport(report.type)}
          >
            <div className="report-icon">{report.icon}</div>
            <div className="report-info">
              <h4 className="report-name">{report.name}</h4>
              <p className="report-description">{report.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportSelector;