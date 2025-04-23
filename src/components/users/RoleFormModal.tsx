import { useState, useEffect } from 'react';
import { Group, GroupFormData } from '../../hooks/useGroups';
import '../common/modal.css';

interface RoleFormModalProps {
  role: Group | null;
  onClose: () => void;
  onSave: (roleData: GroupFormData) => void;
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({ role, onClose, onSave }) => {
  const [formData, setFormData] = useState<GroupFormData>({
    name: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
      });
    }
  }, [role]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'El nombre del rol es obligatorio';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
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