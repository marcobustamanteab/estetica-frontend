// src/pages/UsersPage.tsx
import React, { useState, useEffect } from 'react';
import { useUsers, User, UserFormData } from '../../hooks/useUsers';
import UserFormModal from '../../components/users/UserFormModal';
import DataTable from '../../components/common/DataTable';
import SwitchToggle from '../../components/common/SwitchToggle';
import { createColumnHelper } from '@tanstack/react-table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';


const UsersPage: React.FC = () => {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { 
    users, 
    loading,
    error,
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus 
  } = useUsers();
  
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };
  
  // Abrir modal para editar un usuario existente
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
  // Eliminar un usuario con confirmación
  const handleDeleteUser = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteUser(id);
        toast.success('Usuario eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        toast.error('Ocurrió un error al eliminar el usuario');
      }
    }
  };
  
  // Cambiar el estado de un usuario con confirmación
  const handleToggleStatus = async (id: number, isActive: boolean) => {
    // Usar SweetAlert2 para la confirmación
    const result = await Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} usuario?`,
      text: `¿Estás seguro que deseas ${isActive ? 'desactivar' : 'activar'} este usuario?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        await toggleUserStatus(id, isActive);
        toast.success(`Usuario ${isActive ? 'desactivado' : 'activado'} correctamente`);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        toast.error('Ocurrió un error al cambiar el estado del usuario');
      }
    }
  };
  
  // Guardar un usuario (crear o actualizar)
  const handleSaveUser = async (userData: UserFormData) => {
    setIsModalOpen(false);
    
    try {
      if (selectedUser) {
        // Actualizar usuario existente
        await updateUser(selectedUser.id, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await createUser(userData);
        toast.success('Usuario creado correctamente');
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error('Ocurrió un error al guardar el usuario');
    }
  };

  // Definir columnas para DataTable usando columnHelper
  const columnHelper = createColumnHelper<User>();
  
  const columns = [
    columnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('username', {
      header: 'Usuario',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor(row => `${row.first_name || ''} ${row.last_name || ''}`, {
      id: 'fullName',
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor(row => row.is_staff ? 'Administrador' : 'Empleado', {
      id: 'role',
      header: 'Rol',
      cell: info => info.getValue(),
    }),
    columnHelper.accessor('is_active', {
      header: 'Estado',
      cell: info => (
        <span className={`status-pill ${info.getValue() ? 'active' : 'inactive'}`}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="action-buttons">
          <SwitchToggle 
            isActive={info.row.original.is_active} 
            onChange={() => handleToggleStatus(info.row.original.id, info.row.original.is_active)}
            size="small"
          />
          <button 
            className="icon-button edit-button"
            onClick={() => handleEditUser(info.row.original)}
            title="Editar usuario"
          >
            <EditIcon fontSize="small" />
          </button>
          <button 
            className="icon-button delete-button"
            onClick={() => handleDeleteUser(info.row.original.id)}
            title="Eliminar usuario"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Administración de Usuarios</h2>
        <button className="add-button" onClick={handleAddUser}>Nuevo Usuario</button>
      </div>
      
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}
      
      {loading && users.length === 0 ? (
        <p className="loading-message">Cargando usuarios...</p>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          title="Usuarios del Sistema"
          filterPlaceholder="Buscar usuario..."
        />
      )}
      
      {isModalOpen && (
        <UserFormModal
          user={selectedUser}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default UsersPage;