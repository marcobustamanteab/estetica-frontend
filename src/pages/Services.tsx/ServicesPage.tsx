/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/ServicesPage.tsx
import React, { useState, useEffect } from 'react';
import { useServices, Service, ServiceCategory, ServiceFormData } from '../../hooks/useServices';
import { ServiceFormValues } from '../../forms/ServiceFormValues';
import { CategoryFormValues } from '../../forms/categoryFormValues';
import ServiceFormModal from '../../components/services/ServiceFormModal';
import CategoryFormModal from '../../components/services/CategoryFormModal';
import DataTable from '../../components/common/DataTable';
import SwitchToggle from '../../../src/components/common/SwitchToggle';
import { createColumnHelper } from '@tanstack/react-table';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import './services.css';

const ServicesPage: React.FC = () => {
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Cuando cambia la categoría seleccionada, actualizar los servicios
  useEffect(() => {
    if (selectedCategoryId) {
      fetchServices(selectedCategoryId);
    } else {
      fetchServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <button 
            className="icon-button view-button"
            onClick={() => handleFilterByCategory(info.row.original.id)}
            title="Ver servicios de esta categoría"
          >
            <i className="fa fa-eye"></i>
          </button>
        </div>
      ),
    }),
  ];

  return (
    <div className="services-page">
      <div className="page-header">
        <h2>Gestión de Servicios</h2>
        <div className="header-actions">
          <button className="add-button category-button" onClick={handleAddCategory}>
            <AddIcon fontSize="small" /> Nueva Categoría
          </button>
          <button className="add-button" onClick={handleAddService}>
            <AddIcon fontSize="small" /> Nuevo Servicio
          </button>
        </div>
      </div>
      
      {error && (
        <div className="error-alert">
          <p>{error}</p>
        </div>
      )}
      
      {/* Filtro por categoría */}
      <div className="category-filter">
        <span>Filtrar por categoría:</span>
        <div className="category-buttons">
          <button 
            className={`category-filter-button ${selectedCategoryId === null ? 'active' : ''}`}
            onClick={() => handleFilterByCategory(null)}
          >
            Todas
          </button>
          {categories.map((category: { id: number | null ; name: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | React.ReactPortal | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }) => (
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
      
      <div className="services-container">
        <div className="categories-section">
          <h3 className="section-title">Categorías de Servicios</h3>
          {loading && categories.length === 0 ? (
            <p className="loading-message">Cargando categorías...</p>
          ) : (
            <DataTable 
              columns={categoryColumns} 
              data={categories} 
              filterPlaceholder="Buscar categoría..."
            />
          )}
        </div>
        
        <div className="services-section">
          <h3 className="section-title">
            {selectedCategoryId 
              ? `Servicios de ${categories.find((c: { id: number; }) => c.id === selectedCategoryId)?.name || ''}` 
              : 'Todos los Servicios'
            }
          </h3>
          {loading && services.length === 0 ? (
            <p className="loading-message">Cargando servicios...</p>
          ) : (
            <DataTable 
              columns={serviceColumns} 
              data={services} 
              filterPlaceholder="Buscar servicio..."
            />
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
          onClose={() => setIsCategoryModalOpen(false)}
          onSave={handleSaveCategory}
        />
      )}
    </div>
  );
};

export default ServicesPage;