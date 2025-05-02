import React, { useState, useEffect } from 'react';
import { Group, Permission } from '../../hooks/useGroups';
import '../common/modal.css';
import './rolePermissionsModal.css';

interface RolePermissionsModalProps {
  role: Group;
  availablePermissions: Permission[];
  onClose: () => void;
  onSave: (permissions: number[]) => void;
}

const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({ 
  role,
  availablePermissions,
  onClose,
  onSave
}) => {
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Agrupar permisos por modelo
  const permissionsByModel: Record<string, Permission[]> = {};
  availablePermissions.forEach(permission => {
    const model = permission.content_type.model;
    if (!permissionsByModel[model]) {
      permissionsByModel[model] = [];
    }
    permissionsByModel[model].push(permission);
  });
  
  // Inicializar los permisos seleccionados
  useEffect(() => {
    if (role && role.permissions) {
      setSelectedPermissions(role.permissions.map(p => p.id));
    }
  }, [role]);
  
  const handleTogglePermission = (permissionId: number) => {
    setSelectedPermissions(prev => {
      if (prev.includes(permissionId)) {
        return prev.filter(id => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };
  
  const handleToggleAllModelPermissions = (model: string, checked: boolean) => {
    const modelPermissionIds = permissionsByModel[model].map(p => p.id);
    
    if (checked) {
      // Añadir todos los permisos del modelo que no estén ya seleccionados
      setSelectedPermissions(prev => {
        const newPermissions = [...prev];
        modelPermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id);
          }
        });
        return newPermissions;
      });
    } else {
      // Quitar todos los permisos del modelo
      setSelectedPermissions(prev => 
        prev.filter(id => !modelPermissionIds.includes(id))
      );
    }
  };
  
  const areAllModelPermissionsSelected = (model: string) => {
    const modelPermissionIds = permissionsByModel[model].map(p => p.id);
    return modelPermissionIds.every(id => selectedPermissions.includes(id));
  };
  
  const areSomeModelPermissionsSelected = (model: string) => {
    const modelPermissionIds = permissionsByModel[model].map(p => p.id);
    return modelPermissionIds.some(id => selectedPermissions.includes(id)) && 
           !areAllModelPermissionsSelected(model);
  };
  
  const getTranslatedModel = (model: string): string => {
    const translations: Record<string, string> = {
      'user': 'Usuario',
      'group': 'Grupo/Rol',
      'permission': 'Permiso',
      'client': 'Cliente',
      'service': 'Servicio',
      'servicecategory': 'Categoría de Servicio',
      'appointment': 'Cita',
      // Añadir más modelos según sea necesario
    };
    
    return translations[model] || model;
  };
  
  const getTranslatedPermission = (codename: string): string => {
    const translations: Record<string, string> = {
      'add': 'Agregar',
      'change': 'Modificar',
      'delete': 'Eliminar',
      'view': 'Ver',
      // Añadir más acciones según sea necesario
    };
    
    // Intentar extraer la acción del codename (generalmente es la primera parte)
    const parts = codename.split('_');
    if (parts.length > 1) {
      const action = parts[0];
      return translations[action] || action;
    }
    
    return codename;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedPermissions);
  };
  
  // Filtrar modelos por término de búsqueda
  const filteredModels = Object.keys(permissionsByModel)
    .filter(model => 
      searchTerm === '' || 
      getTranslatedModel(model).toLowerCase().includes(searchTerm.toLowerCase()) ||
      permissionsByModel[model].some(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  
  return (
    <div className="modal-overlay">
      <div className="modal-container permissions-modal">
        <div className="modal-header">
          <h3>Gestionar Permisos: {role.name}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <div className="permissions-search">
          <input
            type="text"
            placeholder="Buscar permisos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <form onSubmit={handleSubmit} className="permissions-form">
          <div className="permissions-list">
            {filteredModels.map(model => (
              <div key={model} className="permission-model">
                <div className="model-header">
                  <label className="model-checkbox">
                    <input
                      type="checkbox"
                      checked={areAllModelPermissionsSelected(model)}
                      ref={el => {
                        if (el) {
                          el.indeterminate = areSomeModelPermissionsSelected(model);
                        }
                      }}
                      onChange={(e) => handleToggleAllModelPermissions(model, e.target.checked)}
                    />
                    <span className="model-name">{getTranslatedModel(model)}</span>
                  </label>
                </div>
                
                <div className="model-permissions">
                  {permissionsByModel[model].map(permission => (
                    <label key={permission.id} className="permission-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(permission.id)}
                        onChange={() => handleTogglePermission(permission.id)}
                      />
                      <span className="permission-name">
                        {getTranslatedPermission(permission.codename)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            
            {filteredModels.length === 0 && (
              <div className="no-results">
                No se encontraron resultados para "{searchTerm}"
              </div>
            )}
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="save-button">Guardar Permisos</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RolePermissionsModal;