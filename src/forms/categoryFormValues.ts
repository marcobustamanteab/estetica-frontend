// src/forms/categoryFormValues.ts
import { ServiceCategory } from '../hooks/useServices';

export interface CategoryFormValues {
  name: string;
  description: string;
  is_active: boolean;
}

export const getInitialCategoryFormValues = (category: ServiceCategory | null): CategoryFormValues => {
  if (category) {
    return {
      name: category.name,
      description: category.description || '',
      is_active: category.is_active
    };
  }
  
  return {
    name: '',
    description: '',
    is_active: true
  };
};

export const validateCategoryForm = (values: CategoryFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.name) {
    errors.name = 'El nombre es obligatorio';
  }
  
  return errors;
};