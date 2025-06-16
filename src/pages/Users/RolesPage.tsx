import { useState, useEffect } from "react";
import { useGroups, Group } from "../../hooks/useGroups";
import { useUsers } from "../../hooks/useUsers";
import { RoleFormValues } from "../../forms/roleFormValues";
import DataTable from "../../components/common/DataTable";
import RoleFormModal from "../../components/users/RoleFormModal";
import RolePermissionsModal from "../../components/users/RolePermissionsModal";
import { createColumnHelper } from "@tanstack/react-table";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
// import SecurityIcon from "@mui/icons-material/Security";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./rolesPage.css";

// Extendemos la interfaz Group para incluir nuestro conteo calculado
interface EnrichedGroup extends Group {
  calculated_user_count?: number;
}

const RolesPage: React.FC = () => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Group | null>(null);
  const [groupsWithUserCount, setGroupsWithUserCount] = useState<EnrichedGroup[]>([]);

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
    updateGroupPermissions,
  } = useGroups();

  const { users, fetchUsers } = useUsers();

  // Cargar datos iniciales
  useEffect(() => {
    fetchGroups();
    fetchPermissions();
    fetchUsers();
  }, []);


  // Calcular el conteo de usuarios por grupo
  useEffect(() => {
    if (groups.length > 0 && users.length > 0) {
      // Crear contador de usuarios por grupo
      const userCountByGroup: Record<number, number> = {};
      
      // Contar usuarios por grupo
      users.forEach(user => {
        if (user.groups && Array.isArray(user.groups)) {
          user.groups.forEach(group => {
            // Manejar dos posibles formatos: objeto o ID
            const groupId = typeof group === 'object' && group !== null 
              ? group.id 
              : Number(group);
            
            if (!isNaN(groupId)) {
              userCountByGroup[groupId] = (userCountByGroup[groupId] || 0) + 1;
            }
          });
        }
      });
      
      // Actualizar los grupos con los conteos calculados
      const enrichedGroups = groups.map(group => ({
        ...group,
        calculated_user_count: userCountByGroup[group.id] || 0
      }));
      
      console.log('DEBUG - Conteo calculado de usuarios por grupo:', userCountByGroup);
      console.log('DEBUG - Grupos enriquecidos:', enrichedGroups);
      
      setGroupsWithUserCount(enrichedGroups);
    }
  }, [groups, users]);

  // Abrir modal para crear un nuevo rol
  const handleAddRole = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };

  const handleEditRole = (role: Group) => {
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };

  // const handleManagePermissions = (role: Group) => {
  //   setSelectedRole(role);
  //   setIsPermissionsModalOpen(true);
  // };

  const handleDeleteRole = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar rol?",
      text: "Esta acción podría afectar a los usuarios asignados a este rol",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteGroup(id);
        toast.success("Rol eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar rol:", error);
        toast.error("Ocurrió un error al eliminar el rol");
      }
    }
  };

  const handleSaveRole = async (roleData: RoleFormValues) => {
    setIsFormModalOpen(false);

    try {
      if (selectedRole) {
        await updateGroup(selectedRole.id, roleData);
        toast.success("Rol actualizado correctamente");
      } else {
        await createGroup(roleData);
        toast.success("Rol creado correctamente");
      }

      await fetchGroups();
    } catch (error) {
      console.error("Error al guardar rol:", error);
      toast.error("Ocurrió un error al guardar el rol");
    }
  };

  const handleSavePermissions = async (permissions: number[]) => {
    setIsPermissionsModalOpen(false);

    if (!selectedRole) return;

    try {
      await updateGroupPermissions(selectedRole.id, permissions);
      toast.success("Permisos actualizados correctamente");
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
      toast.error("Ocurrió un error al actualizar los permisos");
    }
  };

  const columnHelper = createColumnHelper<EnrichedGroup>();

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("name", {
      header: "Nombre del Rol",
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: "usersCount",
      header: "Usuarios asignados",
      cell: (info) => {
        // Usar el conteo calculado si está disponible
        const calculatedCount = info.row.original.calculated_user_count;
        return calculatedCount !== undefined ? calculatedCount : (info.row.original.user_count || 0);
      },
    }),
    columnHelper.display({
      id: "permissionsCount",
      header: "Permisos",
      cell: (info) => info.row.original.permissions?.length || 0,
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => (
        <div className="action-buttons">
          {/* <button
            className="icon-button permissions-button"
            onClick={() => handleManagePermissions(info.row.original)}
            title="Gestionar permisos"
          >
            <SecurityIcon fontSize="small" />
          </button> */}
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
        <button className="add-button" onClick={handleAddRole}>
          <AddIcon fontSize="small" /> Nuevo Rol
        </button>
      </div>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}

      {loading && groupsWithUserCount.length === 0 ? (
        <p className="loading-message">Cargando roles...</p>
      ) : (
        <DataTable
          columns={columns}
          data={groupsWithUserCount.length > 0 ? groupsWithUserCount : groups}
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