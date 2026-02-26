/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useUsers, User, UserFormData } from '../../hooks/useUsers';
import { useGroups } from '../../hooks/useGroups';
import { useAuth } from '../../context/AuthContext';
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
import { getRolePillColor } from '../../components/common/PillsColors';
import { useNavigate } from 'react-router-dom';

interface Business {
  id: number;
  name: string;
}

const UsersPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<number | null>(null);

  const { currentUser, logout } = useAuth();
  const isSuperAdmin = (currentUser as any)?.is_superuser === true;
  const navigate = useNavigate();

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

  const loadInitialData = useCallback(async () => {
    await Promise.all([fetchUsers(), fetchGroups()]);
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cargar negocios si es superadmin y setear el propio negocio por defecto
  useEffect(() => {
    if (isSuperAdmin) {
      const token = localStorage.getItem('access');
      axios.get<Business[]>('/api/auth/businesses/', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        console.log('Respuesta businesses:', res.data);
        const data = Array.isArray(res.data) ? res.data : [];
        setBusinesses(data);
        
        // Setear el propio negocio por defecto DESPUÉS de cargar la lista
        if ((currentUser as any)?.business) {
          const business = (currentUser as any)?.business;
          const businessId = typeof business === 'object' ? business?.id : business;
          setSelectedBusiness(businessId);
        }
      }).catch(err => {
        console.error('Error cargando negocios:', err);
        setBusinesses([]);
      });
    } else {
  const business = (currentUser as any)?.business;
  const businessId = typeof business === 'object' ? business?.id : business;
  setSelectedBusiness(businessId);
}
  }, [isSuperAdmin, currentUser]);

  // Filtrar usuarios por negocio seleccionado
  const filteredUsers = selectedBusiness
    ? users.filter((u: any) => u.business === selectedBusiness)
    : users;

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
        
        // Si el usuario editó su propia contraseña, re-autenticar
        if (selectedUser.id === (currentUser as any)?.id && userData.password) {
          toast.info('Contraseña actualizada. Cerrando sesión...', { autoClose: 2000 });
          setTimeout(() => {
            logout();
            navigate('/login');
          }, 2000);
          return;
        }
        
        toast.success('Usuario actualizado correctamente');
      } else {
        await createUser(userData);
        toast.success('Usuario creado correctamente');
      }
      fetchUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      toast.error('Ocurrió un error al guardar el usuario');
    }
  };

  const getUserRoles = (user: User) => {
    if (!user.groups || user.groups.length === 0) return [];

    const firstItem = user.groups[0];

    if (typeof firstItem === 'object' && firstItem !== null && 'name' in firstItem) {
      return user.groups.map(group => (group as { name: string }).name);
    }

    return user.groups.map(groupId => {
      const group = groups.find(g => g.id === (typeof groupId === 'object' ? (groupId as { id: number }).id : groupId));
      return group ? group.name : 'Rol desconocido';
    });
  };

  const columnHelper = createColumnHelper<User>();

  const columns = [
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
      cell: (info) => {
        const isCurrentUser = info.row.original.id === (currentUser as any)?.id;
        return (
          <div className="action-buttons">
            {!isCurrentUser && (
              <SwitchToggle
                isActive={info.row.original.is_active}
                onChange={() => handleToggleStatus(info.row.original.id, info.row.original.is_active)}
                size="small"
              />
            )}
            <button
              className="icon-button edit-button"
              onClick={() => handleEditUser(info.row.original)}
              title="Editar usuario"
            >
              <EditIcon fontSize="small" />
            </button>
            {!isCurrentUser && (
              <button
                className="icon-button delete-button"
                onClick={() => handleDeleteUser(info.row.original.id)}
                title="Eliminar usuario"
              >
                <DeleteIcon fontSize="small" />
              </button>
            )}
          </div>
        );
      },
    }),
  ];

  const exportColumns: ExportColumn[] = [
    { header: 'Nombre de Usuario', accessor: 'username' },
    { header: 'Email', accessor: 'email' },
    { header: 'Nombre', accessor: 'first_name', formatFn: (value: any) => value || 'No especificado' },
    { header: 'Apellido', accessor: 'last_name', formatFn: (value: any) => value || 'No especificado' },
    {
      header: 'Roles',
      accessor: 'groups',
      formatFn: (value: number[], row: { is_staff: any }) => {
        if (row.is_staff) return 'Administrador';
        if (!value || value.length === 0) return 'Sin roles';

        const roleNames = value.map((groupId: number) => {
          const group = groups.find(g => g.id === groupId);
          return group ? group.name : 'Rol desconocido';
        });

        return roleNames.join(', ');
      }
    },
  ];

  return (
    <div className="users-page">
      <div className="page-header">
        <h2>Administración de Usuarios</h2>
        <div className="header-actions">
          {/* Filtro de negocio solo para superadmin */}
          {isSuperAdmin && (
            <select
              value={selectedBusiness ?? ''}
              onChange={(e) => setSelectedBusiness(e.target.value ? Number(e.target.value) : null)}
              className="filter-select"
            >
              <option value="">Todos los negocios</option>
              {(businesses || []).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}
          <button className="add-button" onClick={handleAddUser}>
            <AddIcon fontSize="small" /> Nuevo Usuario
          </button>
        </div>
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
          data={filteredUsers}
          title="Usuarios del Sistema"
          filterPlaceholder="Buscar usuario..."
          exportConfig={{
            columns: exportColumns,
            fileName: "usuarios"
          }}
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