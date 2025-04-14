// src/pages/users/RolesPage.tsx
import React, { useState, useEffect } from 'react';
import { useGroups, Group, GroupFormData } from '../../hooks/useGroups';
import DataTable from '../../components/common/DataTable';
import RoleFormModal from '../../components/users/RoleFormModal';
import RolePermissionsModal from '../../components/users/RolePermissionsModal';
import { createColumnHelper } from '@tanstack/react-table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './rolesPage.css';

const RolesPage: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Group | null>(null);
  
  const { 
    groups, 
    loading,
    error,
    fetchGroups, 
    createGroup, 
    updateGroup, 
    deleteGroup,
    fetchPermissions,
    availablePermissions,
    updateGroupPermissions
  } = useGroups();
  
  useEffect(() => {
    fetchGroups();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Abrir modal para crear un nuevo rol
  const handleAddRole = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };
  
  // Abrir modal para editar un rol existente
  const handleEditRole = (role: Group) => {
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };
  
  // Abrir modal para gestionar permisos de un rol
  const handleManagePermissions = (role: Group) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };
  
  // Eliminar un rol con confirmación
  const handleDeleteRole = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar rol?',
      text: 'Esta acción podría afectar a los usuarios asignados a este rol',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteGroup(id);
        toast.success('Rol eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar rol:', error);
        toast.error('Ocurrió un error al eliminar el rol');
      }
    }
  };
  
  // Guardar un rol (crear o actualizar)
  const handleSaveRole = async (roleData: GroupFormData) => {
    setIsFormModalOpen(false);
    
    try {
      if (selectedRole) {
        if (!selectedRole.id) {
          toast.error('No se puede actualizar: rol sin ID válido');
          console.error("Intento de actualizar rol sin ID:", selectedRole);
          return;
        }
        
        // Actualizar rol existente
        await updateGroup(selectedRole.id, roleData);
        toast.success('Rol actualizado correctamente');
      } else {
        // Crear nuevo rol
        await createGroup(roleData);
        toast.success('Rol creado correctamente');
      }
      
      // Añadir esta línea para recargar explícitamente los roles
      await fetchGroups();
      
    } catch (error) {
      console.error('Error al guardar rol:', error);
      toast.error('Ocurrió un error al guardar el rol');
    }
  };
  
  // Guardar permisos de un rol
  const handleSavePermissions = async (permissions: number[]) => {
    setIsPermissionsModalOpen(false);
    
    if (!selectedRole) return;
    
    try {
      await updateGroupPermissions(selectedRole.id, permissions);
      toast.success('Permisos actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar permisos:', error);
      toast.error('Ocurrió un error al actualizar los permisos');
    }
  };

  // Definir columnas para DataTable
  const columnHelper = createColumnHelper<Group>();
  
  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('name', {
      header: 'Nombre del Rol',
      cell: info => info.getValue(),
    }),
    columnHelper.display({
      id: 'usersCount',
      header: 'Usuarios asignados',
      cell: info => info.row.original.user_set?.length || 0,
    }),
    columnHelper.display({
      id: 'permissionsCount',
      header: 'Permisos',
      cell: info => info.row.original.permissions?.length || 0,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="action-buttons">
          <button 
            className="icon-button permissions-button"
            onClick={() => handleManagePermissions(info.row.original)}
            title="Gestionar permisos"
          >
            <SecurityIcon fontSize="small" />
          </button>
          <button 
            className="icon-button edit-button"
            onClick={() => handleEditRole(info.row.original)}
            title="Editar rol"
          >
            <EditIcon fontSize="small" />
          </button>
          <button 
            className="icon-button delete-button"
            onClick={() => handleDeleteRole(info.row.original.id)}
            title="Eliminar rol"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <div className="roles-page">
      <div className="page-header">
        <h2>Administración de Roles</h2>
        <button className="add-button" onClick={handleAddRole}>Nuevo Rol</button>
      </div>
      
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}
      
      {loading && groups.length === 0 ? (
        <p className="loading-message">Cargando roles...</p>
      ) : (
        <DataTable 
          columns={columns} 
          data={groups} 
          title="Roles del Sistema"
          filterPlaceholder="Buscar rol..."
        />
      )}
      
      {/* Modal para crear/editar rol */}
      {isFormModalOpen && (
        <RoleFormModal
          role={selectedRole}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveRole}
        />
      )}
      
      {/* Modal para gestionar permisos */}
      {isPermissionsModalOpen && selectedRole && (
        <RolePermissionsModal
          role={selectedRole}
          availablePermissions={availablePermissions}
          onClose={() => setIsPermissionsModalOpen(false)}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};

export default RolesPage;