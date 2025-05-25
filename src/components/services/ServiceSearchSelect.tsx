import { useState, useRef, useEffect } from 'react';
import '../../assets/styles/services/serviceSearchSelect.css';
import { Service } from '../../hooks/useServices';

interface ServiceSearchSelectProps {
  services: Service[];
  value: number;
  onChange: (serviceId: number) => void;
  disabled?: boolean;
  error?: boolean;
  id: string;
  name: string;
  placeholder?: string;
  showPriceAndDuration?: boolean;
}

const ServiceSearchSelect: React.FC<ServiceSearchSelectProps> = ({
  services,
  value,
  onChange,
  disabled = false,
  error = false,
  id,
  name,
  placeholder = "Seleccione un servicio...",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar servicios basados en el término de búsqueda
  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener el servicio seleccionado
  const selectedService = services.find(service => service.id === value);

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
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleServiceSelect = (serviceId: number) => {
    onChange(serviceId);
    setIsOpen(false);
  };

  // Agrupar servicios por categoría
  const servicesByCategory: Record<string, Service[]> = {};
  filteredServices.forEach(service => {
    const categoryName = service.category_name || 'Sin categoría';
    if (!servicesByCategory[categoryName]) {
      servicesByCategory[categoryName] = [];
    }
    servicesByCategory[categoryName].push(service);
  });

  return (
    <div className={`service-search-container ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <div className="service-search-header" onClick={toggleDropdown}>
        <div className="service-search-selected">
          {selectedService 
            ? (
                <div className="selected-service-info">
                  <span className="service-name">{selectedService.name}</span>
                </div>
              )
            : placeholder}
        </div>
        <div className="service-search-actions">
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="service-search-dropdown">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              className="service-search-input"
              placeholder="Buscar servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <div className="service-list">
            {Object.keys(servicesByCategory).length > 0 ? (
              Object.keys(servicesByCategory).map(categoryName => (
                <div key={categoryName} className="service-category-group">
                  <div className="category-header">{categoryName}</div>
                  <ul className="category-services">
                    {servicesByCategory[categoryName].map(service => (
                      <li 
                        key={service.id} 
                        className={`service-item ${service.id === value ? 'selected' : ''} ${!service.is_active ? 'inactive' : ''}`}
                        onClick={() => handleServiceSelect(service.id)}
                      >
                        <div className="service-main-info">
                          <div className="service-name">
                            {service.name}
                            {!service.is_active && <span className="inactive-badge">Inactivo</span>}
                          </div>
                          <div className="service-price-duration">
                            ${service.price} - {service.duration} min
                          </div>
                        </div>
                        {service.description && (
                          <div className="service-description">{service.description}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <div className="no-results">
                No se encontraron servicios con "{searchTerm}"
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

export default ServiceSearchSelect;