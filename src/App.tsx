import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import LoginPage from './pages/authentication/LoginPage';
import RegisterPage from './pages/authentication/RegisterPage';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import UsersPage from './pages/Users/UsersPage';
import ClientsPage from './pages/Clients/ClientsPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import Spinner from './components/common/Spinner';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ServicesPage from './pages/Services.tsx/ServicesPage';
import AppointmentsPage from './pages/Appointments/AppointmentsPage';
import RolesPage from './pages/Users/RolesPage';

// Componente que verifica autenticación y renderiza el Layout con el contenido apropiado
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner text="Cargando..." />;
  }

  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }

  return <Layout>{element}</Layout>;
};

// Componente para la página de usuarios principal (podría ser un panel de control o resumen)
const UsersIndexPage: React.FC = () => {
  return (
    <div className="users-index-page">
      <div className="page-header">
        <h2>Módulo de Usuarios</h2>
      </div>
      <div className="users-dashboard">
        <p>Selecciona una opción del menú para gestionar usuarios.</p>
        {/* Aquí podrías agregar tarjetas o enlaces rápidos a las diferentes secciones */}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
      <AuthProvider>
        <LoadingProvider>
          <Router>
            <Routes>
              {/* Rutas públicas (sin Layout) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Rutas protegidas (con Layout) */}
              <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
              
              {/* Rutas de Usuarios con submenús */}
              <Route path="/usuarios" element={<ProtectedRoute element={<UsersIndexPage />} />} />
              <Route path="/usuarios/administracion" element={<ProtectedRoute element={<UsersPage />} />} />
              <Route path="/usuarios/roles" element={<ProtectedRoute element={<RolesPage />} />} />
              
              {/* otras rutas */}
              <Route path="/clientes" element={<ProtectedRoute element={<ClientsPage />} />} />
              <Route path="/servicios" element={<ProtectedRoute element={<ServicesPage />} />} /> 
              <Route path="/agenda" element={<ProtectedRoute element={<AppointmentsPage />} />} />
              <Route path="/reportes" element={<ProtectedRoute element={<ReportsPage />} />} />
              <Route path="/mantenedores" element={<ProtectedRoute element={<SettingsPage />} />} />

              {/* Ruta por defecto */}
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </Router>
        </LoadingProvider>
      </AuthProvider>
      );
};

      export default App;