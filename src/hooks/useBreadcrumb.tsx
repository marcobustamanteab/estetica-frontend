import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BreadcrumbItem } from '../components/common/Breadcrumb';

// Mapeo directo de rutas con títulos y subtítulos
const routeMap: Record<string, { title: string, subtitle: string }> = {
  '/usuarios': {
    title: 'Usuarios',
    subtitle: 'Gestión de Usuarios'
  },
  '/clientes': {
    title: 'Clientes',
    subtitle: 'Gestión de Clientes'
  },
  '/servicios': {
    title: 'Servicios',
    subtitle: 'Gestión de Servicios'
  },
  '/agenda': {
    title: 'Agenda',
    subtitle: 'Gestión de Citas'
  },
  '/reportes': {
    title: 'Reportes',
    subtitle: 'Informes y Estadísticas'
  },
  '/mantenedores': {
    title: 'Mantenedores',
    subtitle: 'Configuración del Sistema'
  },
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Panel Principal'
  }
};

/**
 * Hook simplificado que genera breadcrumbs directos para las secciones principales
 */
export const useBreadcrumbs = (customItems?: BreadcrumbItem[]): BreadcrumbItem[] => {
  const location = useLocation();
  const [items, setItems] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    // Si hay items personalizados, usarlos directamente
    if (customItems) {
      setItems(customItems);
      return;
    }

    // Caso contrario, generar breadcrumbs simplificados
    const generateSimpleBreadcrumbs = () => {
      const path = location.pathname;
      
      // Si estamos en el dashboard, mostrar solo "Dashboard"
      if (path === '/dashboard') {
        return [{ label: 'Dashboard', path: '/dashboard', active: true }];
      }
      
      // Para rutas principales, usar el mapeo directo
      for (const route in routeMap) {
        if (path === route) {
          return [
            { label: routeMap[route].title, path: route, active: true }
          ];
        }
      }
      
      // Para subrutas (ejemplo: /clientes/123)
      const mainRoute = '/' + path.split('/')[1];
      if (routeMap[mainRoute]) {
        const items = [
          { label: routeMap[mainRoute].title, path: mainRoute }
        ];
        
        // Verificar si hay un ID en la ruta (ejemplo: /clientes/123)
        const pathParts = path.split('/').filter(Boolean);
        if (pathParts.length > 1) {
          if (!isNaN(Number(pathParts[1]))) {
            // Es un ID numérico
            items.push({
              label: `${routeMap[mainRoute].subtitle}`,
              path: path,
              active: true
            });
          } else {
            // Es una acción o subruta (ejemplo: /clientes/nuevo)
            items.push({
              label: pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1),
              path: path,
              active: true
            });
          }
        }
        
        return items;
      }
      
      // Si no hay mapeo, devolver solo la ruta actual
      return [{ label: 'Página Actual', path, active: true }];
    };

    setItems(generateSimpleBreadcrumbs());
  }, [location.pathname, customItems]);

  return items;
};

export default useBreadcrumbs;