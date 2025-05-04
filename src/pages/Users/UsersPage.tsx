/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import { useUsers, User, UserFormData } from '../../hooks/useUsers';
import { useGroups } from '../../hooks/useGroups';
import UserFormModal from '../../components/users/UserFormModal';
import DataTable from '../../components/common/DataTable';
import SwitchToggle from '../../components/common/SwitchToggle';
import { createColumnHelper } from '@tanstack/react-table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { ExportColumn } from '../../types/ExportColumn';
import './usersPage.css';

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const { 
    users, 
    loading: usersLoading,
    error: usersError,
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus 
  } = useUsers();
  
  const {
    groups,
    loading: groupsLoading,
    fetchGroups
  } = useGroups();
  
  // Cargar datos solo una vez al montar el componente
  const loadInitialData = useCallback(async () => {
    await Promise.all([
      fetchUsers(),
      fetchGroups()
    ]);
  }, []);
  
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);
  
  const handleAddUser = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };
  
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };
  
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
  
  const handleToggleStatus = async (id: number, isActive: boolean) => {
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
  
  const handleSaveUser = async (userData: UserFormData) => {
    setIsModalOpen(false);
    
    try {
      if (selectedUser) {
        await updateUser(selectedUser.id, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        await createUser(userData);
        toast.success('Usuario creado correctamente');
      }
      
      // Recargar la lista de usuarios después de crear/actualizar
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error('Ocurrió un error al guardar el usuario');
    }
  };

  // Función para obtener los nombres de los roles de un usuario
  const getUserRoles = (user: User) => {
    if (!user.groups || user.groups.length === 0) return [];
  
    // Check first item to determine the structure
    const firstItem = user.groups[0];
    
    // If groups are objects with name property
    if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem) {
      return user.groups.map(group => (group as {name: string}).name);
    }
    
    // If groups are just IDs
    return user.groups.map(groupId => {
      const group = groups.find(g => g.id === (typeof groupId === 'object' ? (groupId as {id: number}).id : groupId));
      return group ? group.name : 'Rol desconocido';
    });
  };

  // Colores para las pills de roles
  const rolePillColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, // Azul claro
    { bg: '#D1FAE5', text: '#059669' }, // Verde claro
    { bg: '#FCE7F3', text: '#DB2777' }, // Rosa claro
    { bg: '#FEF3C7', text: '#D97706' }, // Amarillo claro
    { bg: '#E0E7FF', text: '#4F46E5' }, // Indigo claro
  ];

  // Asignar un color consistente basado en el nombre del rol
  const getRolePillColor = (roleName: string) => {
    // Usar una suma de códigos de caracteres para asignar consistentemente el mismo color a un rol
    const charSum = roleName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return rolePillColors[charSum % rolePillColors.length];
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
    columnHelper.accessor(row => row.is_staff ? ['Administrador'] : getUserRoles(row), {
      id: 'roles',
      header: 'Roles',
      cell: info => {
        const roles = info.getValue();
        if (!roles || roles.length === 0) return <span className="no-roles">Sin roles</span>;
        
        return (
          <div className="role-pills">
            {roles.map((role, index) => {
              const { bg, text } = getRolePillColor(role);
              return (
                <span 
                  key={index} 
                  className="role-pill"
                  style={{ backgroundColor: bg, color: text }}
                >
                  {role}
                </span>
              );
            })}
          </div>
        );
      },
    }),
    columnHelper.accessor('is_active', {
      header: 'Estado',
      cell: info => (
        <span className={`status-badge ${info.getValue() ? 'active' : 'inactive'}`}>
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

  // Definir las columnas para exportación
  const exportColumns: ExportColumn[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre de Usuario', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Nombre', accessor: 'first_name', formatFn: (value: any) => value || 'No especificado' },
    { header: 'Apellido', accessor: 'last_name', formatFn: (value: any) => value || 'No especificado' },
    // Para Roles, usamos el accessor 'groups' y formateamos en la función
    { 
      header: 'Roles', 
      accessor: 'groups', 
      formatFn: (value: number[], row: { is_staff: any; }) => {
        if (row.is_staff) return 'Administrador';
        if (!value || value.length === 0) return 'Sin roles';
        
        const roleNames = value.map((groupId: number) => {
          const group = groups.find(g => g.id === groupId);
          return group ? group.name : 'Rol desconocido';
        });
        
        return roleNames.join(', ');
      }
    },
    { header: 'Estado', accessor: 'is_active', formatFn: (value: any) => value ? 'Activo' : 'Inactivo' },
    { header: 'Última conexión', accessor: 'last_login', formatFn: (value: any) => value || 'Nunca' }
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Administración de Usuarios</h2>
        <button className="add-button" onClick={handleAddUser}>
          <AddIcon fontSize="small" /> Nuevo Usuario
        </button>
      </div>
      
      {usersError && (
        <div className="error-alert">
          <p>{usersError}</p>
        </div>
      )}
      
      {(usersLoading && users.length === 0) || groupsLoading ? (
        <p className="loading-message">Cargando usuarios...</p>
      ) : (
        <DataTable 
          columns={columns} 
          data={users} 
          title="Usuarios del Sistema"
          filterPlaceholder="Buscar usuario..."
          exportConfig={{
            columns: exportColumns,
            fileName: "usuarios"
          }}
        />
      )}
      
      {/* Solo mostrar el modal cuando isModalOpen es true */}
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