import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './breadcrumb.css';

export interface BreadcrumbItem {
  label: string;
  path: string;
  active?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string | React.ReactNode;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  separator = '/', 
  className = '' 
}) => {
  const location = useLocation();
  
  return (
    <nav className={`breadcrumb-container ${className}`} aria-label="breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isActive = item.active || location.pathname === item.path;
          
          return (
            <li 
              key={`${item.path}-${index}`} 
              className={`breadcrumb-item ${isActive ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast || isActive ? (
                <span className="breadcrumb-text">{item.label}</span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {item.label}
                </Link>
              )}
              
              {!isLast && (
                <span className="breadcrumb-separator">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;