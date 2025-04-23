import { useState } from 'react';
import ReportSelector from '../../components/reports/ReportSelector';
import SalesReport from '../../components/reports/SalesReport';
import ServicesReport from '../../components/reports/ServicesReport';
import EmployeesReport from '../../components/reports/EmployeesReport';
import './reportsPage.css';

// Tipos de reportes disponibles
export type ReportType = 'sales' | 'services' | 'employees' | null;

const ReportsPage: React.FC = () => {
  // Estado para el tipo de reporte seleccionado
  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  // Manejador de cambio de reporte
  const handleReportChange = (reportType: ReportType) => {
    setSelectedReport(reportType);
  };

  // Renderizar el reporte seleccionado
  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':
        return <SalesReport />;
      case 'services':
        return <ServicesReport />;
      case 'employees':
        return <EmployeesReport />;
      default:
        return (
          <div className="select-report-message">
            <h3>Selecciona un tipo de reporte para comenzar</h3>
            <p>Utiliza las opciones de arriba para generar el reporte que necesitas.</p>
          </div>
        );
    }
  };

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Reportes</h2>
      </div>

      <div className="reports-container">
        {/* Selector de tipo de reporte */}
        <ReportSelector 
          selectedReport={selectedReport} 
          onSelectReport={handleReportChange} 
        />
        
        {/* Contenedor del reporte seleccionado */}
        <div className="report-content">
          {renderReport()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;