import { useState, useRef, useEffect } from 'react';
import '../../assets/styles/services/categorySearchSelect.css';
import { ServiceCategory } from '../../hooks/useServices';

interface CategorySearchSelectProps {
  categories: ServiceCategory[];
  value: number | null;
  onChange: (categoryId: number | null) => void;
  disabled?: boolean;
  error?: boolean;
  id: string;
  name: string;
  placeholder?: string;
}

const CategorySearchSelect: React.FC<CategorySearchSelectProps> = ({
  categories,
  value,
  onChange,
  disabled = false,
  error = false,
  id,
  name,
  placeholder = "Seleccione una categoría..."
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar categorías basadas en el término de búsqueda
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener la categoría seleccionada
  const selectedCategory = categories.find(category => category.id === value);

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

  const handleCategorySelect = (categoryId: number | null) => {
    onChange(categoryId);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onChange(null);
    setIsOpen(false);
  };

  return (
    <div className={`category-search-container ${error ? 'has-error' : ''} ${disabled ? 'disabled' : ''}`} ref={wrapperRef}>
      <div className="category-search-header" onClick={toggleDropdown}>
        <div className="category-search-selected">
          {selectedCategory 
            ? selectedCategory.name
            : placeholder}
        </div>
        <div className="category-search-actions">
          {selectedCategory && (
            <button 
              type="button" 
              className="clear-category-button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              title="Limpiar selección"
            >
              ✕
            </button>
          )}
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="category-search-dropdown">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              className="category-search-input"
              placeholder="Buscar categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <ul className="category-list">
            {/* Opción para limpiar selección */}
            <li 
              className="category-item clear-option"
              onClick={() => handleClearSelection()}
            >
              <div className="category-name">-- Ninguna categoría --</div>
            </li>
            
            {filteredCategories.length > 0 ? (
              filteredCategories.map(category => (
                <li 
                  key={category.id} 
                  className={`category-item ${category.id === value ? 'selected' : ''} ${!category.is_active ? 'inactive' : ''}`}
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <div className="category-name">
                    {category.name}
                    {!category.is_active && <span className="inactive-badge">Inactiva</span>}
                  </div>
                  {category.description && (
                    <div className="category-description">{category.description}</div>
                  )}
                </li>
              ))
            ) : (
              <li className="no-results">
                No se encontraron categorías con "{searchTerm}"
              </li>
            )}
          </ul>
        </div>
      )}
      
      {/* Campo oculto para formularios */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ''}
      />
    </div>
  );
};

export default CategorySearchSelect;