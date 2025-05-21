// src/pages/Clients/ClientsPage.tsx
import { useState, useEffect } from "react";
import { useClients, Client, ClientFormData } from "../../hooks/useClients";
import ClientFormModal from "../../components/clients/ClientFormModal";
import DataTable from "../../components/common/DataTable";
import SwitchToggle from "../../components/common/SwitchToggle";
import { createColumnHelper } from "@tanstack/react-table";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "./clients.css";
import { exportColumns } from "./exportData";

const ClientsPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const {
    clients,
    loading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
  } = useClients();

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleDeleteClient = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar cliente?",
      text: "Esta acción no se puede deshacer",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await deleteClient(id);
        toast.success("Cliente eliminado correctamente");
      } catch (error) {
        console.error("Error al eliminar cliente:", error);
        toast.error("Ocurrió un error al eliminar el cliente");
      }
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    const result = await Swal.fire({
      title: `¿${isActive ? "Desactivar" : "Activar"} cliente?`,
      text: `¿Estás seguro que deseas ${
        isActive ? "desactivar" : "activar"
      } este cliente?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d9488",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await toggleClientStatus(id, isActive);
        toast.success(
          `Cliente ${isActive ? "desactivado" : "activado"} correctamente`
        );
      } catch (error) {
        console.error("Error al cambiar estado:", error);
        toast.error("Ocurrió un error al cambiar el estado del cliente");
      }
    }
  };

  const handleSaveClient = async (clientData: ClientFormData) => {
    setIsModalOpen(false);

    try {
      if (selectedClient) {
        // Actualizar cliente existente
        await updateClient(selectedClient.id, clientData);
        toast.success("Cliente actualizado correctamente");
      } else {
        // Crear nuevo cliente
        await createClient(clientData);
        toast.success("Cliente creado correctamente");
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      toast.error("Ocurrió un error al guardar el cliente");
    }
  };

  // Definir columnas para DataTable usando columnHelper
  const columnHelper = createColumnHelper<Client>();

  const columns = [
    columnHelper.accessor("id", {
      header: "ID",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor((row) => `${row.first_name} ${row.last_name}`, {
      id: "fullName",
      header: "Nombre Completo",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("email", {
      header: "Email",
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor("phone", {
      header: "Teléfono",
      cell: (info) => info.getValue() || "-",
    }),
    columnHelper.accessor("gender", {
      header: "Género",
      cell: (info) => {
        const gender = info.getValue();
        if (gender === "M") return "Masculino";
        if (gender === "F") return "Femenino";
        if (gender === "O") return "Otro";
        return "-";
      },
    }),
    columnHelper.accessor("is_active", {
      header: "Estado",
      cell: (info) => (
        <span
          className={`status-pill ${info.getValue() ? "active" : "inactive"}`}
        >
          {info.getValue() ? "Activo" : "Inactivo"}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Acciones",
      cell: (info) => (
        <div className="action-buttons">
          <SwitchToggle
            isActive={info.row.original.is_active}
            onChange={() =>
              handleToggleStatus(
                info.row.original.id,
                info.row.original.is_active
              )
            }
            size="small"
          />
          <button
            className="icon-button edit-button"
            onClick={() => handleEditClient(info.row.original)}
            title="Editar cliente"
          >
            <EditIcon fontSize="small" />
          </button>
          <button
            className="icon-button delete-button"
            onClick={() => handleDeleteClient(info.row.original.id)}
            title="Eliminar cliente"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];

  return (
    <div className="clients-page">
      <div className="page-header">
        <h2>Gestión de Clientes</h2>
        <div className="header-actions">
          <button className="add-button" onClick={handleAddClient}>
          <AddIcon fontSize="small" /> Nuevo Cliente
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}

      {loading && clients.length === 0 ? (
        <p className="loading-message">Cargando clientes...</p>
      ) : (
        <DataTable 
          columns={columns} 
          data={clients} 
          title="Clientes del Sistema"
          filterPlaceholder="Buscar cliente..."
          exportConfig={{
            columns: exportColumns,
            fileName: "clientes"
          }}
        />
      )}

      {isModalOpen && (
        <ClientFormModal
          client={selectedClient}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveClient}
        />
      )}
    </div>
  );
};

export default ClientsPage;