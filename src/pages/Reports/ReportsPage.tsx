/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ReportSelector from '../../components/reports/ReportSelector';
import SalesReport from '../../components/reports/SalesReport';
import ServicesReport from '../../components/reports/ServicesReport';
import EmployeesReport from '../../components/reports/EmployeesReport';
import MyEarningsReport from '../../components/reports/MyEarningsReport';
import './reportsPage.css';

export type ReportType = 'sales' | 'services' | 'employees' | null;

const ReportsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isBarber = currentUser && !(currentUser as any).is_staff && !(currentUser as any).is_superuser;

  const [selectedReport, setSelectedReport] = useState<ReportType>(null);

  const renderReport = () => {
    switch (selectedReport) {
      case 'sales':     return <SalesReport />;
      case 'services':  return <ServicesReport />;
      case 'employees': return <EmployeesReport />;
      default:
        return (
          <div className="select-report-message">
            <h3>Selecciona un tipo de reporte para comenzar</h3>
            <p>Utiliza las opciones de arriba para generar el reporte que necesitas.</p>
          </div>
        );
    }
  };

  // Vista para barberos
  if (isBarber) {
    return (
      <div className="reports-page">
        <div className="page-header">
          <h2>Mis Reportes</h2>
        </div>
        <div className="reports-container">
          <div className="report-content" style={{ width: '100%' }}>
            <MyEarningsReport />
          </div>
        </div>
      </div>
    );
  }

  // Vista para admins y superadmins
  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Reportes</h2>
      </div>
      <div className="reports-container">
        <ReportSelector
          selectedReport={selectedReport}
          onSelectReport={setSelectedReport}
        />
        <div className="report-content">
          {renderReport()}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;