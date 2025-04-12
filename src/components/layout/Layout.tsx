// Modificación para implementar correctamente breadcrumbs en Layout.tsx

import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Breadcrumb from '../common/Breadcrumb';
import useBreadcrumbs from '../../hooks/useBreadcrumb';
import './layout.css';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();

  // No mostrar breadcrumbs en el dashboard principal
  const showBreadcrumbs = location.pathname !== '/dashboard';

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={`layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <Sidebar expanded={sidebarOpen} user={currentUser} />
      </aside>

      {/* Área principal */}
      <div className="main-container">
        {/* Header */}
        <header className="header">
          <button className="menu-button" onClick={toggleSidebar}>☰</button>
          <h1 className="title">Beauty Care</h1>
          <button className="logout-button" onClick={handleLogout}>Salir</button>
        </header>

        {/* Main Content */}
        <main className="main-content">
          {showBreadcrumbs && <Breadcrumb items={breadcrumbs} />}
          {children}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>Beauty Care © 2025 - Tu centro de belleza y bienestar</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;