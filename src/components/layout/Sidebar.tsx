/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiUsers,
  FiUserCheck,
  FiCalendar,
  FiBarChart2,
  FiSettings,
  FiScissors,
  FiChevronDown,
  FiChevronRight,
  FiUserPlus,
  FiShield,
} from "react-icons/fi";
import avatarImage from "../../assets/img/avatar001.jpeg";
import "./sidebar.css";

interface SidebarProps {
  expanded: boolean;
  user: any; // Reemplazar con el tipo de usuario correcto
}

// Tipo para los items del menú con soporte para submenús
interface MenuItem {
  path: string;
  icon: JSX.Element;
  label: string;
  subMenus?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, user }) => {
  // Estado para mantener los submenús expandidos/colapsados
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Definir las opciones del menú con iconos de react-icons
  const menuItems: MenuItem[] = [
    { path: "/dashboard", icon: <FiHome size={20} />, label: "Dashboard" },
    {
      path: "/usuarios",
      icon: <FiUsers size={20} />,
      label: "Usuarios",
      subMenus: [
        // { path: '/usuarios/miperfil', icon: <FiUserCheck size={20} />, label: 'Mi Perfil' },
        {
          path: "/usuarios/administracion",
          icon: <FiUserPlus size={20} />,
          label: "Administración de Usuarios",
        },
        {
          path: "/usuarios/roles",
          icon: <FiShield size={20} />,
          label: "Administración de Roles",
        },
      ],
    },
    { path: "/clientes", icon: <FiUserCheck size={20} />, label: "Clientes" },
    { path: "/servicios", icon: <FiScissors size={20} />, label: "Servicios" },
    { path: "/agenda", icon: <FiCalendar size={20} />, label: "Agenda" },
    { path: "/reportes", icon: <FiBarChart2 size={20} />, label: "Reportes" },
    {
      path: "/mantenedores",
      icon: <FiSettings size={20} />,
      label: "Mantenedores",
    },
  ];

  const getUserRole = (): string => {

    if (!user) return "Usuario";

    if (user.is_staff === true) {
      return "Administrador";
    }

    if (user.groups && user.groups.length > 0) {
      const firstGroup = user.groups[0];

      if (
        typeof firstGroup === "object" &&
        firstGroup !== null &&
        "name" in firstGroup
      ) {
        return firstGroup.name;
      }
      return `Rol ${firstGroup}`;
    }

    return "Sin rol asignado";
  };

  // Manejar clic en menú con submenú
  const toggleSubmenu = (e: React.MouseEvent, path: string) => {
    // Detener la propagación del evento para evitar comportamientos inesperados
    e.preventDefault();
    e.stopPropagation();

    setExpandedMenus((prevState) => {
      if (prevState.includes(path)) {
        return prevState.filter((item) => item !== path);
      } else {
        return [...prevState, path];
      }
    });
  };

  useEffect(() => {
    if (!expanded) {
      setExpandedMenus([]); // Colapsar todos los submenús cuando se colapsa la sidebar
    }
  }, [expanded]);

  // Verificar si un menú está expandido
  const isMenuExpanded = (path: string) => {
    return expandedMenus.includes(path);
  };

  // Renderizar items de menú con soporte para submenús
  const renderMenuItem = (item: MenuItem, index: number) => {
    const hasSubmenu = item.subMenus && item.subMenus.length > 0;
    const isExpanded = isMenuExpanded(item.path);

    return (
      <li key={index}>
        {hasSubmenu ? (
          // Menú con submenús
          <>
            <div
              className={`menu-item has-submenu ${
                isExpanded ? "expanded" : ""
              }`}
              onClick={(e) => toggleSubmenu(e, item.path)}
            >
              <span className="menu-icon">{item.icon}</span>
              {expanded && (
                <>
                  <span className="menu-label">{item.label}</span>
                  <span className="submenu-icon">
                    {isExpanded ? (
                      <FiChevronDown size={16} />
                    ) : (
                      <FiChevronRight size={16} />
                    )}
                  </span>
                </>
              )}
            </div>

            {/* Submenús */}
            {(isExpanded || !expanded) && (
              <ul className={`submenu ${isExpanded ? "expanded" : ""}`}>
                {item.subMenus?.map((subItem, subIndex) => (
                  <li key={`${index}-${subIndex}`}>
                    <NavLink
                      to={subItem.path}
                      className={({ isActive }) => (isActive ? "active" : "")}
                    >
                      <span className="menu-icon">{subItem.icon}</span>
                      {expanded && (
                        <span className="menu-label">{subItem.label}</span>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          // Menú sin submenús
          <NavLink
            to={item.path}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <span className="menu-icon">{item.icon}</span>
            {expanded && <span className="menu-label">{item.label}</span>}
          </NavLink>
        )}
      </li>
    );
  };

  return (
    <div className="sidebar-component">
      {expanded ? (
        // Perfil expandido - muestra avatar e información
        <div className="user-profile">
          <div className="avatar-container">
            <img
              src={user?.profile_image || avatarImage}
              alt="Avatar"
              className="user-avatar"
            />
          </div>
          <div className="user-info">
            <div className="user-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="user-role">{getUserRole()}</div>
          </div>
        </div>
      ) : (
        // Perfil colapsado - solo muestra avatar
        <div className="user-profile">
          <div className="avatar-container">
            <img
              src={user?.profile_image || avatarImage}
              alt="Avatar"
              className="user-avatar"
            />
          </div>
        </div>
      )}

      <div className="sidebar-divider"></div>

      <nav className="sidebar-nav">
        <ul>{menuItems.map(renderMenuItem)}</ul>
      </nav>
    </div>
  );
};

export default Sidebar;
