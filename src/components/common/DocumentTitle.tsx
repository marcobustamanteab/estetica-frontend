import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Componente para manejar el título del documento según la ruta actual
 */
const DocumentTitle: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Mapeo de rutas a títulos
    const getTitleForPath = (pathname: string): string => {
      // Eliminar slash inicial y final si existen
      const path = pathname.replace(/^\/|\/$/g, '');
      
      // Mapeo de rutas a títulos
      const routeTitles: Record<string, string> = {
        '': 'Inicio',
        'dashboard': 'Dashboard',
        'clientes': 'Clientes',
        'servicios': 'Servicios',
        'agenda': 'Agenda',
        'calendario': 'Calendario',
        'reportes': 'Reportes',
        'mantenedores': 'Mantenedores',
        'usuarios': 'Usuarios',
        'usuarios/administracion': 'Administración de Usuarios',
        'usuarios/roles': 'Roles y Permisos',
        'login': 'Iniciar Sesión',
        'register': 'Registro'
      };

      // Buscar la ruta más específica que coincida
      const matchingPaths = Object.keys(routeTitles)
        .filter(routePath => path.startsWith(routePath))
        .sort((a, b) => b.length - a.length); // Ordenar por longitud descendente para obtener la más específica

      if (matchingPaths.length > 0) {
        return routeTitles[matchingPaths[0]];
      }

      // Si no hay coincidencia, devolver un título por defecto
      return 'BeautyCare';
    };

    // Obtener el título para la ruta actual
    const pageTitle = getTitleForPath(location.pathname);
    
    // Actualizar el título del documento
    document.title = `BeautyCare | ${pageTitle}`;
  }, [location]);

  // Este componente no renderiza nada visible
  return null;
};

export default DocumentTitle;