// src/components/services/CategoryFormModal.tsx
import React, { useState, useEffect } from 'react';
import { ServiceCategory } from '../../hooks/useServices';
import { CategoryFormValues, getInitialCategoryFormValues, validateCategoryForm } from '../../forms/categoryFormValues';
import '../common/modal.css';

interface CategoryFormModalProps {
    category: ServiceCategory | null;
    onClose: () => void;
    onSave: (categoryData: CategoryFormValues) => void;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onClose, onSave }) => {
    const [formData, setFormData] = useState<CategoryFormValues>(getInitialCategoryFormValues(category));
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        setFormData(getInitialCategoryFormValues(category));
    }, [category]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const target = e.target as HTMLInputElement;
            setFormData(prev => ({
                ...prev,
                [name]: target.checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateCategoryForm(formData);
        setErrors(formErrors);

        if (Object.keys(formErrors).length > 0) return;

        onSave(formData);
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
                        <label htmlFor="name">Nombre de la Categoría</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={errors.name ? 'form-input error' : 'form-input'}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Descripción</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            className="form-input"
                            rows={3}
                        />
                    </div>

                    <div className="form-group checkbox-group">
                        <label>
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={formData.is_active}
                                onChange={handleChange}
                            />
                            Categoría Activa
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

export default CategoryFormModal;