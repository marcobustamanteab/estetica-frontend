/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useProducts, Product, ProductCategory, StockMovement, MovementType } from '../../hooks/useProducts';
import { useAuth } from '../../context/AuthContext';
import { createColumnHelper } from '@tanstack/react-table';
import DataTable from '../../components/common/DataTable';
import SwitchToggle from '../../components/common/SwitchToggle';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './products.css';

// ─── Sub-components ───────────────────────────────────────────────────────────

const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: 'Entrada',
  out: 'Salida',
  sale: 'Venta',
  adjustment: 'Ajuste',
  return: 'Devolución',
};

const MOVEMENT_COLORS: Record<MovementType, string> = {
  in:         '#dcfce7',
  return:     '#dcfce7',
  out:        '#fee2e2',
  sale:       '#fee2e2',
  adjustment: '#fef3c7',
};

const MOVEMENT_TEXT: Record<MovementType, string> = {
  in:         '#15803d',
  return:     '#15803d',
  out:        '#dc2626',
  sale:       '#dc2626',
  adjustment: '#92400e',
};

// ─── Category Modal ───────────────────────────────────────────────────────────

interface CategoryModalProps {
  category: ProductCategory | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; is_active: boolean }) => void;
}

const CategoryModal: React.FC<CategoryModalProps> = ({ category, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    description: category?.description ?? '',
    is_active: category?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrors({ name: 'El nombre es obligatorio' });
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>{category ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Nombre <span className="required">*</span></label>
            <input
              className={`form-input${errors.name ? ' error' : ''}`}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <textarea
              className="form-input"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              <span className="checkbox-text">Categoría Activa</span>
            </label>
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

// ─── Product Modal ────────────────────────────────────────────────────────────

interface ProductModalProps {
  product: Product | null;
  categories: ProductCategory[];
  onClose: () => void;
  onSave: (data: any) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, categories, onClose, onSave }) => {
  const isCreating = !product;
  const activeCategories = categories.filter((c) => c.is_active);
  const [form, setForm] = useState({
    category: product?.category ?? (activeCategories[0]?.id ?? 0),
    name: product?.name ?? '',
    description: product?.description ?? '',
    sale_price: product?.sale_price ?? '',
    cost_price: product?.cost_price ?? '',
    initial_stock: '',
    min_stock: product?.min_stock ?? 0,
    is_active: product?.is_active ?? true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!form.category) errs.category = 'La categoría es obligatoria';
    if (!form.sale_price || Number(form.sale_price) <= 0) errs.sale_price = 'El precio de venta debe ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    onSave({
      category: Number(form.category),
      name: form.name.trim(),
      description: form.description || null,
      sale_price: Number(form.sale_price),
      cost_price: form.cost_price !== '' ? Number(form.cost_price) : null,
      min_stock: Number(form.min_stock),
      is_active: form.is_active,
      // solo al crear — el padre lo usa para generar la Entrada automática
      initial_stock: isCreating && form.initial_stock !== '' ? Number(form.initial_stock) : 0,
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h3>{product ? 'Editar Producto' : 'Nuevo Producto'}</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Categoría <span className="required">*</span></label>
              <select
                className={`form-input${errors.category ? ' error' : ''}`}
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: Number(e.target.value) }))}
              >
                <option value={0}>Seleccionar...</option>
                {activeCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.category && <span className="error-message">{errors.category}</span>}
            </div>
            <div className="form-group">
              <label>Nombre <span className="required">*</span></label>
              <input
                className={`form-input${errors.name ? ' error' : ''}`}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <textarea
              className="form-input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Precio de Venta <span className="required">*</span></label>
              <input
                type="number"
                min={0}
                step="0.01"
                className={`form-input${errors.sale_price ? ' error' : ''}`}
                value={form.sale_price}
                onChange={(e) => setForm((p) => ({ ...p, sale_price: e.target.value }))}
              />
              {errors.sale_price && <span className="error-message">{errors.sale_price}</span>}
            </div>
            <div className="form-group">
              <label>Costo <span className="prod-optional">(opcional)</span></label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="form-input"
                value={form.cost_price}
                onChange={(e) => setForm((p) => ({ ...p, cost_price: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row">
            {/* Stock inicial solo al crear */}
            {isCreating && (
              <div className="form-group">
                <label>
                  Stock inicial
                  <span className="prod-optional"> (unidades que tenés ahora)</span>
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="ej: 6"
                  className="form-input"
                  value={form.initial_stock}
                  onChange={(e) => setForm((p) => ({ ...p, initial_stock: e.target.value }))}
                />
                <span className="prod-field-hint">
                  Se registrará como Entrada automática. Dejá en blanco si aún no tenés unidades.
                </span>
              </div>
            )}
            <div className="form-group">
              <label>
                Alerta de stock bajo
                <span className="prod-optional"> (mínimo)</span>
              </label>
              <input
                type="number"
                min={0}
                placeholder="ej: 2"
                className="form-input"
                value={form.min_stock}
                onChange={(e) => setForm((p) => ({ ...p, min_stock: Number(e.target.value) }))}
              />
              <span className="prod-field-hint">
                Cuando el stock llegue a este número o menos, aparecerá un indicador de alerta.
              </span>
            </div>
          </div>

          <div className="form-group" style={{ paddingTop: 4 }}>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
              />
              <span className="checkbox-text">Activo</span>
            </label>
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

// ─── Stock Movement Modal ─────────────────────────────────────────────────────

interface MovementModalProps {
  products: Product[];
  preselectedProduct?: Product | null;
  onClose: () => void;
  onSave: (data: any) => void;
}

const MovementModal: React.FC<MovementModalProps> = ({ products, preselectedProduct, onClose, onSave }) => {
  const activeProducts = products.filter((p) => p.is_active);
  const [form, setForm] = useState({
    product: preselectedProduct?.id ?? (activeProducts[0]?.id ?? 0),
    movement_type: 'in' as MovementType,
    quantity: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isPositive = (t: MovementType) => t === 'in' || t === 'return';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.product) errs.product = 'Selecciona un producto';
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'La cantidad debe ser mayor a 0';
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const qty = isPositive(form.movement_type) ? Number(form.quantity) : -Number(form.quantity);
    onSave({
      product: form.product,
      movement_type: form.movement_type,
      quantity: qty,
      notes: form.notes || null,
    });
  };

  const selectedProduct = activeProducts.find((p) => p.id === form.product);

  return (
    <div className="modal-overlay">
      <div className="modal-container" style={{ maxWidth: 460 }}>
        <div className="modal-header">
          <h3>Registrar Movimiento de Stock</h3>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label>Producto <span className="required">*</span></label>
            <select
              className={`form-input${errors.product ? ' error' : ''}`}
              value={form.product}
              disabled={!!preselectedProduct}
              onChange={(e) => setForm((p) => ({ ...p, product: Number(e.target.value) }))}
            >
              <option value={0}>Seleccionar...</option>
              {activeProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Stock: {p.current_stock})
                </option>
              ))}
            </select>
            {errors.product && <span className="error-message">{errors.product}</span>}
          </div>

          <div className="form-group">
            <label>Tipo de Movimiento <span className="required">*</span></label>
            <div className="prod-movement-types">
              {(Object.entries(MOVEMENT_LABELS) as [MovementType, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`prod-movement-type-btn${form.movement_type === key ? ' active' : ''}`}
                  style={form.movement_type === key ? {
                    background: MOVEMENT_COLORS[key],
                    color: MOVEMENT_TEXT[key],
                    borderColor: MOVEMENT_TEXT[key],
                  } : {}}
                  onClick={() => setForm((p) => ({ ...p, movement_type: key }))}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Cantidad <span className="required">*</span></label>
              <input
                type="number"
                min={1}
                className={`form-input${errors.quantity ? ' error' : ''}`}
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
              />
              {errors.quantity && <span className="error-message">{errors.quantity}</span>}
              {selectedProduct && (
                <span className="prod-stock-hint">
                  Stock actual: {selectedProduct.current_stock}
                  {!isPositive(form.movement_type) && form.quantity && (
                    <> → {selectedProduct.current_stock - Number(form.quantity)}</>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>Notas <span className="prod-optional">(opcional)</span></label>
            <textarea
              className="form-input"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Ej: Compra a proveedor, uso en cita #123..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>Cancelar</button>
            <button type="submit" className="save-button">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

type ActiveTab = 'categories' | 'products' | 'movements';

const ProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('products');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [filterCategoryId, setFilterCategoryId] = useState<number | null>(null);
  const [movementsForProduct, setMovementsForProduct] = useState<StockMovement[] | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  const { currentUser } = useAuth();
  const isAdmin = (currentUser as any)?.is_staff || (currentUser as any)?.is_superuser;

  const {
    categories, products, movements,
    fetchCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus,
    fetchProducts, createProduct, updateProduct, deleteProduct, toggleProductStatus,
    fetchMovements, createMovement, fetchProductMovements,
  } = useProducts();

  useEffect(() => {
    fetchCategories();
    fetchProducts();
    fetchMovements();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Category handlers ──

  const handleSaveCategory = async (data: any) => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, data);
        toast.success('Categoría actualizada');
      } else {
        await createCategory(data);
        toast.success('Categoría creada');
      }
      setIsCategoryModalOpen(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch {
      toast.error('Error al guardar la categoría');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Se eliminarán todos los productos asociados.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await deleteCategory(id);
        toast.success('Categoría eliminada');
        fetchCategories();
        fetchProducts();
      } catch {
        toast.error('Error al eliminar la categoría');
      }
    }
  };

  // ── Product handlers ──

  const handleSaveProduct = async (data: any) => {
    const { initial_stock, ...productData } = data;
    try {
      if (selectedProduct) {
        await updateProduct(selectedProduct.id, productData);
        toast.success('Producto actualizado');
      } else {
        const created = await createProduct(productData);
        // Registrar Entrada automática si se indicó stock inicial
        if (initial_stock > 0) {
          await createMovement({
            product: created.id,
            movement_type: 'in',
            quantity: initial_stock,
            notes: 'Stock inicial al crear el producto',
          });
        }
        toast.success(
          initial_stock > 0
            ? `Producto creado con ${initial_stock} unidad(es) en stock`
            : 'Producto creado'
        );
      }
      setIsProductModalOpen(false);
      setSelectedProduct(null);
      fetchProducts();
      fetchMovements();
    } catch {
      toast.error('Error al guardar el producto');
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      text: 'Se eliminará el producto y su historial de movimientos.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) {
      try {
        await deleteProduct(id);
        toast.success('Producto eliminado');
        fetchProducts();
      } catch {
        toast.error('Error al eliminar el producto');
      }
    }
  };

  // ── Movement handlers ──

  const handleSaveMovement = async (data: any) => {
    try {
      await createMovement(data);
      toast.success('Movimiento registrado');
      setIsMovementModalOpen(false);
      setMovementProduct(null);
      fetchProducts();
      fetchMovements();
    } catch {
      toast.error('Error al registrar el movimiento');
    }
  };

  const handleViewHistory = async (product: Product) => {
    setSelectedProductForHistory(product);
    const data = await fetchProductMovements(product.id);
    setMovementsForProduct(data);
  };

  // ── Column definitions ──

  const catCol = createColumnHelper<ProductCategory>();
  const categoryColumns = [
    catCol.accessor('name', { header: 'Nombre', cell: (i) => i.getValue() }),
    catCol.accessor('description', { header: 'Descripción', cell: (i) => i.getValue() || '—' }),
    catCol.accessor('product_count', {
      header: 'Productos',
      cell: (i) => <span className="prod-count-badge">{i.getValue()}</span>,
    }),
    catCol.accessor('is_active', {
      header: 'Estado',
      cell: (i) => (
        <span className={`status-pill ${i.getValue() ? 'active' : 'inactive'}`}>
          {i.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    catCol.display({
      id: 'actions',
      header: 'Acciones',
      cell: (i) => (
        <div className="action-buttons">
          <SwitchToggle
            isActive={i.row.original.is_active}
            onChange={() => toggleCategoryStatus(i.row.original.id, i.row.original.is_active)}
            size="small"
          />
          <button className="icon-button edit-button" onClick={() => { setSelectedCategory(i.row.original); setIsCategoryModalOpen(true); }}>
            <EditIcon fontSize="small" />
          </button>
          <button className="icon-button delete-button" onClick={() => handleDeleteCategory(i.row.original.id)}>
            <DeleteIcon fontSize="small" />
          </button>
        </div>
      ),
    }),
  ];

  const prodCol = createColumnHelper<Product>();
  const filteredProducts = filterCategoryId
    ? products.filter((p) => p.category === filterCategoryId)
    : products;

  const productColumns = [
    prodCol.accessor('name', { header: 'Producto', cell: (i) => i.getValue() }),
    prodCol.accessor('category_name', { header: 'Categoría', cell: (i) => i.getValue() }),
    prodCol.accessor('sale_price', {
      header: 'Precio',
      cell: (i) => `$${Number(i.getValue()).toLocaleString()}`,
    }),
    prodCol.accessor('cost_price', {
      header: 'Costo',
      cell: (i) => i.getValue() ? `$${Number(i.getValue()).toLocaleString()}` : '—',
    }),
    prodCol.accessor('current_stock', {
      header: 'Stock',
      cell: (i) => {
        const product = i.row.original;
        return (
          <span className={`prod-stock-badge${product.is_low_stock ? ' prod-stock-low' : ''}`}>
            {i.getValue()}
            {product.is_low_stock && <span className="prod-low-indicator" title="Stock bajo">!</span>}
          </span>
        );
      },
    }),
    prodCol.accessor('is_active', {
      header: 'Estado',
      cell: (i) => (
        <span className={`status-pill ${i.getValue() ? 'active' : 'inactive'}`}>
          {i.getValue() ? 'Activo' : 'Inactivo'}
        </span>
      ),
    }),
    prodCol.display({
      id: 'actions',
      header: 'Acciones',
      cell: (i) => (
        <div className="action-buttons">
          <button
            className="prod-movement-btn"
            title="Registrar movimiento"
            onClick={() => { setMovementProduct(i.row.original); setIsMovementModalOpen(true); }}
          >
            ±
          </button>
          <button
            className="prod-history-btn"
            title="Ver historial"
            onClick={() => handleViewHistory(i.row.original)}
          >
            📋
          </button>
          <SwitchToggle
            isActive={i.row.original.is_active}
            onChange={() => toggleProductStatus(i.row.original.id, i.row.original.is_active)}
            size="small"
          />
          {isAdmin && (
            <>
              <button className="icon-button edit-button" onClick={() => { setSelectedProduct(i.row.original); setIsProductModalOpen(true); }}>
                <EditIcon fontSize="small" />
              </button>
              <button className="icon-button delete-button" onClick={() => handleDeleteProduct(i.row.original.id)}>
                <DeleteIcon fontSize="small" />
              </button>
            </>
          )}
        </div>
      ),
    }),
  ];

  const movCol = createColumnHelper<StockMovement>();
  const movementColumns = [
    movCol.accessor('created_at', {
      header: 'Fecha',
      cell: (i) => {
        try { return format(parseISO(i.getValue()), "dd/MM/yyyy HH:mm", { locale: es }); }
        catch { return i.getValue(); }
      },
    }),
    movCol.accessor('product_name', { header: 'Producto', cell: (i) => i.getValue() }),
    movCol.accessor('movement_type', {
      header: 'Tipo',
      cell: (i) => {
        const t = i.getValue() as MovementType;
        return (
          <span style={{
            background: MOVEMENT_COLORS[t],
            color: MOVEMENT_TEXT[t],
            padding: '2px 10px',
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
          }}>
            {MOVEMENT_LABELS[t]}
          </span>
        );
      },
    }),
    movCol.accessor('quantity', {
      header: 'Cantidad',
      cell: (i) => {
        const q = i.getValue();
        return (
          <span style={{ fontWeight: 700, color: q > 0 ? '#15803d' : '#dc2626' }}>
            {q > 0 ? '+' : ''}{q}
          </span>
        );
      },
    }),
    movCol.accessor('unit_price', {
      header: 'Precio Unit.',
      cell: (i) => i.getValue() ? `$${Number(i.getValue()).toLocaleString()}` : '—',
    }),
    movCol.accessor('performed_by_name', { header: 'Realizado por', cell: (i) => i.getValue() || '—' }),
    movCol.accessor('notes', { header: 'Notas', cell: (i) => i.getValue() || '—' }),
  ];

  return (
    <div className="products-page">
      <div className="page-header">
        <h2>Gestión de Productos</h2>
        <div className="header-actions">
          {activeTab === 'categories' && isAdmin && (
            <button className="add-button" onClick={() => { setSelectedCategory(null); setIsCategoryModalOpen(true); }}>
              <AddIcon fontSize="small" /> Nueva Categoría
            </button>
          )}
          {activeTab === 'products' && isAdmin && (
            <button className="add-button" onClick={() => { setSelectedProduct(null); setIsProductModalOpen(true); }}>
              <AddIcon fontSize="small" /> Nuevo Producto
            </button>
          )}
          {activeTab === 'movements' && (
            <button className="add-button" onClick={() => { setMovementProduct(null); setIsMovementModalOpen(true); }}>
              <AddIcon fontSize="small" /> Registrar Movimiento
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button className={`tab-button${activeTab === 'categories' ? ' active' : ''}`} onClick={() => setActiveTab('categories')}>
            Categorías
          </button>
          <button className={`tab-button${activeTab === 'products' ? ' active' : ''}`} onClick={() => setActiveTab('products')}>
            Productos
            {products.some((p) => p.is_low_stock) && (
              <span className="prod-low-tab-badge" title="Productos con stock bajo">!</span>
            )}
          </button>
          <button className={`tab-button${activeTab === 'movements' ? ' active' : ''}`} onClick={() => setActiveTab('movements')}>
            Movimientos
          </button>
        </div>

        <div className="tab-content">

          {/* ── Categories tab ── */}
          {activeTab === 'categories' && (
            <DataTable
              columns={categoryColumns}
              data={categories}
              filterPlaceholder="Buscar categoría..."
              exportConfig={{ columns: [
                { header: 'Nombre', accessor: 'name' },
                { header: 'Descripción', accessor: 'description', formatFn: (v: any) => v || '' },
                { header: 'Productos activos', accessor: 'product_count' },
                { header: 'Estado', accessor: 'is_active', formatFn: (v: boolean) => v ? 'Activo' : 'Inactivo' },
              ], fileName: 'categorias-productos' }}
            />
          )}

          {/* ── Products tab ── */}
          {activeTab === 'products' && (
            <>
              {/* Filtro por categoría */}
              <div className="category-filter">
                <span className="category-filter-label">Filtrar por categoría:</span>
                <div className="category-buttons">
                  <button
                    className={`category-filter-button${filterCategoryId === null ? ' active' : ''}`}
                    onClick={() => setFilterCategoryId(null)}
                  >
                    Todos
                  </button>
                  {categories.filter((c) => c.is_active).map((c) => (
                    <button
                      key={c.id}
                      className={`category-filter-button${filterCategoryId === c.id ? ' active' : ''}`}
                      onClick={() => setFilterCategoryId(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <DataTable
                columns={productColumns}
                data={filteredProducts}
                filterPlaceholder="Buscar producto..."
                exportConfig={{ columns: [
                  { header: 'Nombre', accessor: 'name' },
                  { header: 'Categoría', accessor: 'category_name' },
                  { header: 'Precio', accessor: 'sale_price', formatFn: (v: number) => `$${v.toLocaleString()}` },
                  { header: 'Costo', accessor: 'cost_price', formatFn: (v: any) => v ? `$${Number(v).toLocaleString()}` : '' },
                  { header: 'Stock', accessor: 'current_stock' },
                  { header: 'Stock Mínimo', accessor: 'min_stock' },
                  { header: 'Estado', accessor: 'is_active', formatFn: (v: boolean) => v ? 'Activo' : 'Inactivo' },
                ], fileName: 'productos' }}
              />
            </>
          )}

          {/* ── Movements tab ── */}
          {activeTab === 'movements' && (
            <DataTable
              columns={movementColumns}
              data={movements}
              filterPlaceholder="Buscar movimiento..."
              exportConfig={{ columns: [
                { header: 'Fecha', accessor: 'created_at' },
                { header: 'Producto', accessor: 'product_name' },
                { header: 'Tipo', accessor: 'movement_type_display' },
                { header: 'Cantidad', accessor: 'quantity' },
                { header: 'Precio Unit.', accessor: 'unit_price', formatFn: (v: any) => v ? `$${Number(v).toLocaleString()}` : '' },
                { header: 'Realizado por', accessor: 'performed_by_name', formatFn: (v: any) => v || '' },
                { header: 'Notas', accessor: 'notes', formatFn: (v: any) => v || '' },
              ], fileName: 'movimientos-stock' }}
            />
          )}
        </div>
      </div>

      {/* ── History drawer ── */}
      {movementsForProduct && selectedProductForHistory && (
        <div className="modal-overlay" onClick={() => { setMovementsForProduct(null); setSelectedProductForHistory(null); }}>
          <div className="modal-container" style={{ maxWidth: 680 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Historial de Stock — {selectedProductForHistory.name}</h3>
              <button className="close-button" onClick={() => { setMovementsForProduct(null); setSelectedProductForHistory(null); }}>&times;</button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <div className="prod-history-summary">
                <span>Stock actual: <strong>{selectedProductForHistory.current_stock}</strong></span>
                <span>Mínimo: <strong>{selectedProductForHistory.min_stock}</strong></span>
                {selectedProductForHistory.is_low_stock && (
                  <span className="prod-low-warning">Stock bajo</span>
                )}
              </div>
              {movementsForProduct.length === 0 ? (
                <p style={{ color: '#9ca3af', textAlign: 'center', padding: 32 }}>Sin movimientos registrados.</p>
              ) : (
                <table className="prod-history-table">
                  <thead>
                    <tr>
                      <th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Precio</th><th>Realizado por</th><th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movementsForProduct.map((m) => (
                      <tr key={m.id}>
                        <td>
                          {(() => { try { return format(parseISO(m.created_at), "dd/MM/yy HH:mm"); } catch { return m.created_at; } })()}
                        </td>
                        <td>
                          <span style={{
                            background: MOVEMENT_COLORS[m.movement_type as MovementType],
                            color: MOVEMENT_TEXT[m.movement_type as MovementType],
                            padding: '1px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600,
                          }}>
                            {MOVEMENT_LABELS[m.movement_type as MovementType]}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, color: m.quantity > 0 ? '#15803d' : '#dc2626' }}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </td>
                        <td>{m.unit_price ? `$${Number(m.unit_price).toLocaleString()}` : '—'}</td>
                        <td>{m.performed_by_name || '—'}</td>
                        <td>{m.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {isCategoryModalOpen && (
        <CategoryModal
          category={selectedCategory}
          onClose={() => { setIsCategoryModalOpen(false); setSelectedCategory(null); }}
          onSave={handleSaveCategory}
        />
      )}
      {isProductModalOpen && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          onClose={() => { setIsProductModalOpen(false); setSelectedProduct(null); }}
          onSave={handleSaveProduct}
        />
      )}
      {isMovementModalOpen && (
        <MovementModal
          products={products}
          preselectedProduct={movementProduct}
          onClose={() => { setIsMovementModalOpen(false); setMovementProduct(null); }}
          onSave={handleSaveMovement}
        />
      )}
    </div>
  );
};

export default ProductsPage;
