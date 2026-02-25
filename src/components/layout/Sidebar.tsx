/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { JSX, useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import Avatar from "../common/Avatar";
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
import "./sidebar.css";

interface SidebarProps {
  expanded: boolean;
  user: any;
}

interface MenuItem {
  path: string;
  icon: JSX.Element;
  label: string;
  subMenus?: MenuItem[];
}

const Sidebar: React.FC<SidebarProps> = ({ expanded, user }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Determinar nivel de acceso
  const isSuperAdmin = user?.is_superuser === true;
  const isAdmin = user?.is_staff === true;

  // Menú base para todos los usuarios
  const baseMenuItems: MenuItem[] = [
    { path: "/dashboard", icon: <FiHome size={20} />, label: "Dashboard" },
    { path: "/agenda", icon: <FiCalendar size={20} />, label: "Agenda" },
  ];

  // Menú para admins y superadmins
  const adminMenuItems: MenuItem[] = [
    {
      path: "/usuarios",
      icon: <FiUsers size={20} />,
      label: "Usuarios",
      subMenus: [
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
    { path: "/reportes", icon: <FiBarChart2 size={20} />, label: "Reportes" },
  ];

  // Mantenedores solo para superadmin
  const superAdminMenuItems: MenuItem[] = [
    {
      path: "/mantenedores",
      icon: <FiSettings size={20} />,
      label: "Mantenedores",
    },
  ];

  // Construir menú según rol
  const menuItems: MenuItem[] = [
    ...baseMenuItems,
    ...(isAdmin || isSuperAdmin ? adminMenuItems : []),
    ...(isSuperAdmin ? superAdminMenuItems : []),
  ];

  const getUserRole = (): string => {
    if (!user) return "Usuario";

    if (user.is_superuser === true) return "Super Administrador";

    if (user.is_staff === true) return "Administrador";

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

  const toggleSubmenu = (e: React.MouseEvent, path: string) => {
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
      setExpandedMenus([]);
    }
  }, [expanded]);

  const isMenuExpanded = (path: string) => {
    return expandedMenus.includes(path);
  };

  const renderMenuItem = (item: MenuItem, index: number) => {
    const hasSubmenu = item.subMenus && item.subMenus.length > 0;
    const isExpanded = isMenuExpanded(item.path);

    return (
      <li key={index}>
        {hasSubmenu ? (
          <>
            <div
              className={`menu-item has-submenu ${isExpanded ? "expanded" : ""}`}
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
        <div className="user-profile">
          <Avatar
            firstName={user?.first_name}
            lastName={user?.last_name}
            size="medium"
          />
          <div className="user-info">
            <div className="user-name">
              {user?.first_name} {user?.last_name}
            </div>
            <div className="user-role">{getUserRole()}</div>
          </div>
        </div>
      ) : (
        <div className="user-profile">
          <Avatar
            firstName={user?.first_name}
            lastName={user?.last_name}
            size="medium"
            className="avatar-sidebar-collapsed"
          />
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