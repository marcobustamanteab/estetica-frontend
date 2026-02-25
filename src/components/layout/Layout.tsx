/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useBusinessContext } from '../../context/BusinessContext';
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
  const { selectedBusiness, setSelectedBusiness, businesses } = useBusinessContext();
  const navigate = useNavigate();
  const location = useLocation();
  const breadcrumbs = useBreadcrumbs();

  const isSuperAdmin = (currentUser as any)?.is_superuser === true;
  const showBreadcrumbs = location.pathname !== '/dashboard';

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const businessTitle = businesses.find(b => b.id === selectedBusiness)?.name || 'Beauty Care';

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

          <h1 className="title">{businessTitle}</h1>

          {isSuperAdmin && businesses.length > 0 && (
            <select
              value={selectedBusiness ?? ''}
              onChange={(e) => setSelectedBusiness(Number(e.target.value))}
              style={{
                marginRight: '12px',
                padding: '6px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              {businesses.map(b => (
                <option key={b.id} value={b.id} style={{ color: '#000' }}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

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