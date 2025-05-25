import { useState, useRef, useEffect } from 'react';
import '../../assets/styles/services/employeeSearchSelect.css';
import { User } from '../../hooks/useUsers';

interface EmployeeSearchSelectProps {
  employees: User[];
  value: number;
  onChange: (employeeId: number) => void;
  disabled?: boolean;
  error?: boolean;
  loading?: boolean;
  id: string;
  name: string;
  placeholder?: string;
  groups?: Array<{ id: number; name: string }>;
}

const EmployeeSearchSelect: React.FC<EmployeeSearchSelectProps> = ({
  employees,
  value,
  onChange,
  disabled = false,
  error = false,
  loading = false,
  id,
  name,
  placeholder = "Seleccione un empleado...",
  groups = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar empleados basados en el término de búsqueda
  const filteredEmployees = employees.filter(employee => 
    `${employee.first_name} ${employee.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener el empleado seleccionado
  const selectedEmployee = employees.find(employee => employee.id === value);

  // Función para obtener los roles del empleado
  const getEmployeeRoles = (employee: User): string[] => {
    if (employee.is_staff) return ['Administrador'];
    
    if (!employee.groups || employee.groups.length === 0) {
      return ['Sin roles asignados'];
    }
    
    return employee.groups.map((group) => {
      if (typeof group === "object" && group !== null && "name" in group) {
        return group.name;
      }
      const foundGroup = groups.find((g) => g.id === group);
      return foundGroup ? foundGroup.name : `Rol ${group}`;
    });
  };

  // Manejar clic fuera del componente para cerrar el dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Enfocar el campo de búsqueda cuando se abre el dropdown
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled && !loading) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleEmployeeSelect = (employeeId: number) => {
    onChange(employeeId);
    setIsOpen(false);
  };

  // Agrupar empleados por rol
  const employeesByRole: Record<string, User[]> = {};
  filteredEmployees.forEach(employee => {
    const roles = getEmployeeRoles(employee);
    const primaryRole = roles[0] || 'Sin rol';
    
    if (!employeesByRole[primaryRole]) {
      employeesByRole[primaryRole] = [];
    }
    employeesByRole[primaryRole].push(employee);
  });

  return (
    <div className={`employee-search-container ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <div className="employee-search-header" onClick={toggleDropdown}>
        <div className="employee-search-selected">
          {loading ? (
            <span className="loading-text">Cargando empleados...</span>
          ) : selectedEmployee ? (
            <div className="selected-employee-info">
              <span className="employee-name">
                {selectedEmployee.first_name} {selectedEmployee.last_name}
              </span>
              <span className="employee-roles">
                ({getEmployeeRoles(selectedEmployee).join('/')})
              </span>
            </div>
          ) : (
            placeholder
          )}
        </div>
        <div className="employee-search-actions">
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isOpen && !loading && (
        <div className="employee-search-dropdown">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              className="employee-search-input"
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="employee-list">
            {Object.keys(employeesByRole).length > 0 ? (
              Object.keys(employeesByRole).map(roleName => (
                <div key={roleName} className="employee-role-group">
                  <div className="role-header">{roleName}</div>
                  <ul className="role-employees">
                    {employeesByRole[roleName].map(employee => (
                      <li 
                        key={employee.id} 
                        className={`employee-item ${employee.id === value ? 'selected' : ''} ${!employee.is_active ? 'inactive' : ''}`}
                        onClick={() => handleEmployeeSelect(employee.id)}
                      >
                        <div className="employee-main-info">
                          <div className="employee-name">
                            {employee.first_name} {employee.last_name}
                            {!employee.is_active && <span className="inactive-badge">Inactivo</span>}
                          </div>
                          <div className="employee-username">@{employee.username}</div>
                        </div>
                        {employee.email && (
                          <div className="employee-email">{employee.email}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-results">
                {employees.length === 0 
                  ? "No hay empleados disponibles"
                  : `No se encontraron empleados con "${searchTerm}"`
                }
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Campo oculto para formularios */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value}
      />
    </div>
  );
};

export default EmployeeSearchSelect;