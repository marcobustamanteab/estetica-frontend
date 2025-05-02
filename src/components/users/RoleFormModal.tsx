/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Group } from '../../hooks/useGroups';
import { RoleFormValues, getInitialRoleFormValues, validateRoleForm } from '../../forms/roleFormValues';
import '../common/modal.css';

interface RoleFormModalProps {
  role: Group | null;
  onClose: () => void;
  onSave: (roleData: RoleFormValues) => void;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ role, onClose, onSave }) => {
  const [formData, setFormData] = useState<RoleFormValues>(getInitialRoleFormValues(role));
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    setFormData(getInitialRoleFormValues(role));
  }, [role]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formErrors = validateRoleForm(formData);
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) return;
    
    onSave(formData);
  };
  
  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{role ? 'Editar Rol' : 'Nuevo Rol'}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="name">Nombre del Rol <span className="required">*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? 'form-input error' : 'form-input'}
              required
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
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

export default RoleFormModal;