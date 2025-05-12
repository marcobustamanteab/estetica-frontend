// src/components/clients/ClientsSearchSelect.tsx
import React, { useState, useRef, useEffect } from 'react';
import './clientsSearchSelect.css';
import { Client } from '../../hooks/useClients';

interface ClientsSearchSelectProps {
  clients: Client[];
  value: number;
  onChange: (clientId: number) => void;
  onAddNew: () => void;
  disabled?: boolean;
  error?: boolean;
  id: string;
  name: string;
}

const ClientsSearchSelect: React.FC<ClientsSearchSelectProps> = ({
  clients,
  value,
  onChange,
  onAddNew,
  disabled = false,
  error = false,
  id,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtrar clientes basados en el término de búsqueda
  const filteredClients = clients.filter(client => 
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.phone && client.phone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Obtener el cliente seleccionado
  const selectedClient = clients.find(client => client.id === value);

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

  const handleClientSelect = (clientId: number) => {
    onChange(clientId);
    setIsOpen(false);
  };

  return (
    <div className={`clients-search-container ${error ? 'has-error' : ''}`} ref={wrapperRef}>
      <div className="clients-search-header" onClick={toggleDropdown}>
        <div className="clients-search-selected">
          {selectedClient 
            ? `${selectedClient.first_name} ${selectedClient.last_name}` 
            : 'Seleccione un cliente...'}
        </div>
        <div className="clients-search-actions">
          <button 
            type="button" 
            className="add-client-button"
            onClick={(e) => {
              e.stopPropagation();
              onAddNew();
            }}
          >
            + Nuevo Cliente
          </button>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>
      
      {isOpen && (
        <div className="clients-search-dropdown">
          <div className="search-input-container">
            <input
              ref={inputRef}
              type="text"
              className="clients-search-input"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          <ul className="clients-list">
            {filteredClients.length > 0 ? (
              filteredClients.map(client => (
                <li 
                  key={client.id} 
                  className={`client-item ${client.id === value ? 'selected' : ''}`}
                  onClick={() => handleClientSelect(client.id)}
                >
                  <div className="client-name">
                    {client.first_name} {client.last_name}
                  </div>
                  {client.email && (
                    <div className="client-email">{client.email}</div>
                  )}
                  {client.phone && (
                    <div className="client-phone">{client.phone}</div>
                  )}
                </li>
              ))
            ) : (
              <li className="no-results">
                No se encontraron clientes
                <button 
                  type="button" 
                  className="create-client-link"
                  onClick={onAddNew}
                >
                  Crear nuevo cliente
                </button>
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
        value={value}
      />
    </div>
  );
};

export default ClientsSearchSelect;