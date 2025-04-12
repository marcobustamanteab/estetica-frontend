// src/components/services/ServiceFormModal.tsx
import React, { useState, useEffect } from 'react';
import { Service, ServiceCategory } from '../../hooks/useServices';
import { ServiceFormValues, getInitialServiceFormValues, validateServiceForm } from '../../forms/ServiceFormValues';
import '../common/modal.css';

interface ServiceFormModalProps {
  service: Service | null;
  categories: ServiceCategory[];
  onClose: () => void;
  onSave: (serviceData: ServiceFormValues) => void;
}

const ServiceFormModal: React.FC<ServiceFormModalProps> = ({ service, categories, onClose, onSave }) => {
  const [formData, setFormData] = useState<ServiceFormValues>(getInitialServiceFormValues(service, categories));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setFormData(getInitialServiceFormValues(service, categories));
  }, [service, categories]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateServiceForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) return;
    
    // Convertir precio y duración a números antes de enviar
    const serviceData = {
      ...formData,
      price: Number(formData.price),
      duration: Number(formData.duration)
    };
    
    onSave(serviceData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{service ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="category">Categoría</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={errors.category ? 'form-input error' : 'form-input'}
            >
              <option value="-1">Seleccione una categoría...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && <span className="error-message">{errors.category}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="name">Nombre del Servicio</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'form-input error' : 'form-input'}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-input"
              rows={3}
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Precio ($)</label>
              <input
                type="text"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className={errors.price ? 'form-input error' : 'form-input'}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="duration">Duración (minutos)</label>
              <input
                type="text"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className={errors.duration ? 'form-input error' : 'form-input'}
              />
              {errors.duration && <span className="error-message">{errors.duration}</span>}
            </div>
          </div>
          
          <div className="form-group checkbox-group">
            <label>
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
              />
              Servicio Activo
            </label>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="save-button">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceFormModal;