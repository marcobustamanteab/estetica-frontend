// src/pages/Services/ServicesPage.tsx
import React, { useState, useEffect } from 'react';
import { useServices, Service, ServiceCategory, ServiceFormData } from '../../hooks/useServices';
import { ServiceFormValues } from '../../forms/ServiceFormValues';
import { CategoryFormValues } from '../../forms/categoryFormValues';
import ServiceFormModal from '../../components/services/ServiceFormModal';
import CategoryFormModal from '../../components/services/CategoryFormModal';
import DataTable from '../../components/common/DataTable';
import SwitchToggle from '../../components/common/SwitchToggle';
import { createColumnHelper } from '@tanstack/react-table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './services.css';
import { useGroups } from '../../hooks/useGroups';

const ServicesPage: React.FC = () => {
  // Estado para controlar la pestaña activa - CAMBIADO: ahora inicia en 'categories'
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('categories');
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const { groups, fetchGroups } = useGroups();
  
  const { 
    services, 
    categories,
    loading,
    error,
    fetchServices,
    fetchCategories,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus
  } = useServices();
  
  useEffect(() => {
    fetchCategories();
    fetchServices();
    fetchGroups();
  }, []);
  
  // Cuando cambia la categoría seleccionada, actualizar los servicios
  useEffect(() => {
    if (selectedCategoryId) {
      fetchServices(selectedCategoryId);
    } else {
      fetchServices();
    }
  }, [selectedCategoryId]);
  
  // Handlers para servicios
  const handleAddService = () => {
    setSelectedService(null);
    setIsServiceModalOpen(true);
  };
  
  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsServiceModalOpen(true);
  };
  
  const handleDeleteService = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar servicio?',
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
        await deleteService(id);
        toast.success('Servicio eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar servicio:', error);
        toast.error('Ocurrió un error al eliminar el servicio');
      }
    }
  };
  
  const handleToggleServiceStatus = async (id: number, isActive: boolean) => {
    const result = await Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} servicio?`,
      text: `¿Estás seguro que deseas ${isActive ? 'desactivar' : 'activar'} este servicio?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        await toggleServiceStatus(id, isActive);
        toast.success(`Servicio ${isActive ? 'desactivado' : 'activado'} correctamente`);
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        toast.error('Ocurrió un error al cambiar el estado del servicio');
      }
    }
  };
  
  const handleSaveService = async (serviceData: ServiceFormValues) => {
    setIsServiceModalOpen(false);
    
    try {
      // Convertir los datos del formulario al formato correcto para la API
      const apiData: ServiceFormData = {
        category: Number(serviceData.category),
        name: serviceData.name,
        description: serviceData.description || null,
        price: Number(serviceData.price),
        duration: Number(serviceData.duration),
        is_active: serviceData.is_active
      };
      
      if (selectedService) {
        // Actualizar servicio existente
        await updateService(selectedService.id, apiData);
        toast.success('Servicio actualizado correctamente');
      } else {
        // Crear nuevo servicio
        await createService(apiData);
        toast.success('Servicio creado correctamente');
      }
      
      // Recargar servicios
      if (selectedCategoryId) {
        fetchServices(selectedCategoryId);
      } else {
        fetchServices();
      }
    } catch (error) {
      console.error('Error al guardar servicio:', error);
      toast.error('Ocurrió un error al guardar el servicio');
    }
  };
  
  // Handlers para categorías
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };
  
  const handleEditCategory = (category: ServiceCategory) => {
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };
  
  const handleDeleteCategory = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Esto eliminará todos los servicios asociados. Esta acción no se puede deshacer',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await deleteCategory(id);
        // Si la categoría eliminada era la seleccionada, deseleccionarla
        if (selectedCategoryId === id) {
          setSelectedCategoryId(null);
        }
        toast.success('Categoría eliminada correctamente');
        
        // Recargar categorías
        fetchCategories();
      } catch (error) {
        console.error('Error al eliminar categoría:', error);
        toast.error('Ocurrió un error al eliminar la categoría');
      }
    }
  };
  
  const handleToggleCategoryStatus = async (id: number, isActive: boolean) => {
    const result = await Swal.fire({
      title: `¿${isActive ? 'Desactivar' : 'Activar'} categoría?`,
      text: `¿Estás seguro que deseas ${isActive ? 'desactivar' : 'activar'} esta categoría?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
      try {
        await toggleCategoryStatus(id, isActive);
        toast.success(`Categoría ${isActive ? 'desactivada' : 'activada'} correctamente`);
        
        // Recargar categorías
        fetchCategories();
      } catch (error) {
        console.error('Error al cambiar estado:', error);
        toast.error('Ocurrió un error al cambiar el estado de la categoría');
      }
    }
  };
  
  const handleSaveCategory = async (categoryData: CategoryFormValues) => {
    setIsCategoryModalOpen(false);
    
    try {
      if (selectedCategory) {
        // Actualizar categoría existente
        await updateCategory(selectedCategory.id, categoryData);
        toast.success('Categoría actualizada correctamente');
      } else {
        // Crear nueva categoría
        await createCategory(categoryData);
        toast.success('Categoría creada correctamente');
      }
      // Recargar categorías
      fetchCategories();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      toast.error('Ocurrió un error al guardar la categoría');
    }
  };
  
  // Filtrar servicios por categoría
  const handleFilterByCategory = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };
  
  // Definir columnas para DataTable de servicios
  const serviceColumnHelper = createColumnHelper<Service>();
  
  const serviceColumns = [
    serviceColumnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    serviceColumnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    serviceColumnHelper.accessor('category_name', {
      header: 'Categoría',
      cell: info => info.getValue(),
    }),
    serviceColumnHelper.accessor('price', {
      header: 'Precio',
      cell: info => `$${info.getValue().toLocaleString()}`,
    }),
    serviceColumnHelper.accessor('duration', {
      header: 'Duración',
      cell: info => `${info.getValue()} min.`,
    }),
    serviceColumnHelper.accessor('is_active', {
      header: 'Estado',
      cell: info => (
        <span className={`status-pill ${info.getValue() ? 'active' : 'inactive'}`}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    serviceColumnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="action-buttons">
          <SwitchToggle 
            isActive={info.row.original.is_active} 
            onChange={() => handleToggleServiceStatus(info.row.original.id, info.row.original.is_active)}
            size="small"
          />
          <button 
            className="icon-button edit-button"
            onClick={() => handleEditService(info.row.original)}
            title="Editar servicio"
          >
            <EditIcon fontSize="small" />
          </button>
          <button 
            className="icon-button delete-button"
            onClick={() => handleDeleteService(info.row.original.id)}
            title="Eliminar servicio"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];
  
  // Definir columnas para DataTable de categorías
  const categoryColumnHelper = createColumnHelper<ServiceCategory>();
  
  const categoryColumns = [
    categoryColumnHelper.accessor('id', {
      header: 'ID',
      cell: info => info.getValue(),
    }),
    categoryColumnHelper.accessor('name', {
      header: 'Nombre',
      cell: info => info.getValue(),
    }),
    categoryColumnHelper.accessor('description', {
      header: 'Descripción',
      cell: info => info.getValue() || '-',
    }),
    categoryColumnHelper.accessor(row => row.allowed_roles, {
      id: 'roles',
      header: 'Roles Asignados',
      cell: info => {
        const roles = info.getValue();
        if (!roles || roles.length === 0) return <span className="no-roles">Sin roles asignados</span>;
        
        return (
          <div className="role-pills">
            {roles.map((role: {id: number, name: string}, index: number) => (
              <span 
                key={index} 
                className="role-pill"
                style={{ 
                  backgroundColor: '#E0F2FE', 
                  color: '#0369A1',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  marginRight: '4px'
                }}
              >
                {role.name}
              </span>
            ))}
          </div>
        );
      },
    }),
    categoryColumnHelper.accessor('is_active', {
      header: 'Estado',
      cell: info => (
        <span className={`status-pill ${info.getValue() ? 'active' : 'inactive'}`}>
          {info.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    categoryColumnHelper.display({
      id: 'actions',
      header: 'Acciones',
      cell: info => (
        <div className="action-buttons">
          <SwitchToggle 
            isActive={info.row.original.is_active} 
            onChange={() => handleToggleCategoryStatus(info.row.original.id, info.row.original.is_active)}
            size="small"
          />
          <button 
            className="icon-button edit-button"
            onClick={() => handleEditCategory(info.row.original)}
            title="Editar categoría"
          >
            <EditIcon fontSize="small" />
          </button>
          <button 
            className="icon-button delete-button"
            onClick={() => handleDeleteCategory(info.row.original.id)}
            title="Eliminar categoría"
          >
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];

  // Definir columnas para exportación de servicios
  const serviceExportColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'Categoría', accessor: 'category_name' },
    { header: 'Descripción', accessor: 'description', formatFn: (value: string | null) => value || 'No disponible' },
    { header: 'Precio', accessor: 'price', formatFn: (value: number) => `$${value.toLocaleString()}` },
    { header: 'Duración', accessor: 'duration', formatFn: (value: number) => `${value} minutos` },
    { header: 'Estado', accessor: 'is_active', formatFn: (value: boolean) => value ? 'Activo' : 'Inactivo' },
    { header: 'Fecha de Creación', accessor: 'created_at' },
    { header: 'Última Actualización', accessor: 'updated_at' }
  ];

  // Definir columnas para exportación de categorías
  const categoryExportColumns = [
    { header: 'ID', accessor: 'id' },
    { header: 'Nombre', accessor: 'name' },
    { header: 'Descripción', accessor: 'description', formatFn: (value: string | null) => value || 'No disponible' },
    { header: 'Estado', accessor: 'is_active', formatFn: (value: boolean) => value ? 'Activo' : 'Inactivo' },
  ];
  
  // Filtrar servicios por categoría seleccionada
  const filteredServices = selectedCategoryId 
    ? services.filter(service => service.category === selectedCategoryId)
    : services;

  return (
    <div className="services-page">
      <div className="page-header">
        <h2>Gestión de Servicios</h2>
      </div>
      
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Diseño con pestañas - ORDEN CAMBIADO */}
      <div className="tabs-container">
        <div className="tabs-header">
          {/* CAMBIADO: Ahora Categorías aparece primero */}
          <button 
            className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categorías
          </button>
          <button 
            className={`tab-button ${activeTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Servicios
          </button>
        </div>
        
        <div className="tab-content">
          {/* CAMBIADO: Contenido de la pestaña Categorías ahora es primero */}
          {activeTab === 'categories' && (
            <div className="categories-tab-content">
              {/* Encabezado con título y botón de acción */}
              <div className="header-actions-container">
                <div className="title-section">
                  <h3 className="services-title">Categorías de Servicios</h3>
                </div>
                <button className="add-button category-button" onClick={handleAddCategory}>
                  <AddIcon fontSize="small" /> Nueva Categoría
                </button>
              </div>
              
              {/* Tabla de categorías */}
              {loading && categories.length === 0 ? (
                <p className="loading-message">Cargando categorías...</p>
              ) : (
                <DataTable 
                  columns={categoryColumns} 
                  data={categories} 
                  filterPlaceholder="Buscar categoría..."
                  exportConfig={{
                    columns: categoryExportColumns,
                    fileName: "categorias-servicios"
                  }}
                />
              )}
            </div>
          )}
          
          {/* Contenido de la pestaña Servicios */}
          {activeTab === 'services' && (
            <div className="services-tab-content">
              {/* Encabezado con título y botón de acción */}
              <div className="header-actions-container">
                <div className="title-section">
                  <h3 className="services-title">
                    {selectedCategoryId 
                      ? `Servicios de ${categories.find(c => c.id === selectedCategoryId)?.name || ''}` 
                      : 'Todos los Servicios'
                    }
                  </h3>
                </div>
                <button className="add-button" onClick={handleAddService}>
                  <AddIcon fontSize="small" /> Nuevo Servicio
                </button>
              </div>
              
              {/* Filtro de categorías */}
              <div className="category-filter">
                <span className="category-filter-label">Filtrar por categoría:</span>
                <div className="category-buttons">
                  <button 
                    className={`category-filter-button ${selectedCategoryId === null ? 'active' : ''}`}
                    onClick={() => handleFilterByCategory(null)}
                  >
                    Todas
                  </button>
                  {categories.map((category) => (
                    <button 
                      key={category.id}
                      className={`category-filter-button ${selectedCategoryId === category.id ? 'active' : ''}`}
                      onClick={() => handleFilterByCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tabla de servicios */}
              {loading && services.length === 0 ? (
                <p className="loading-message">Cargando servicios...</p>
              ) : (
                <DataTable 
                  columns={serviceColumns} 
                  data={filteredServices} 
                  filterPlaceholder="Buscar servicio..."
                  exportConfig={{
                    columns: serviceExportColumns,
                    fileName: selectedCategoryId 
                      ? `servicios-categoria-${categories.find((c) => c.id === selectedCategoryId)?.name || 'seleccionada'}`.toLowerCase().replace(/\s+/g, '-')
                      : "todos-los-servicios"
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Modales */}
      {isServiceModalOpen && (
        <ServiceFormModal
          service={selectedService}
          categories={categories}
          onClose={() => setIsServiceModalOpen(false)}
          onSave={handleSaveService}
        />
      )}
      
      {isCategoryModalOpen && (
        <CategoryFormModal
          category={selectedCategory}
          availableRoles={groups}
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};

export default ServicesPage;