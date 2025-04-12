import { Service, ServiceCategory } from '../hooks/useServices';

export interface ServiceFormValues {
  category: number;
  name: string;
  description: string;
  price: number | string;
  duration: number | string;
  is_active: boolean;
}

export const getInitialServiceFormValues = (service: Service | null, categories: ServiceCategory[]): ServiceFormValues => {
  if (service) {
    return {
      category: service.category,
      name: service.name,
      description: service.description || '',
      price: service.price,
      duration: service.duration,
      is_active: service.is_active
    };
  }
  
  // Valor por defecto para la categoría (la primera disponible o -1)
  const defaultCategoryId = categories.length > 0 ? categories[0].id : -1;
  
  return {
    category: defaultCategoryId,
    name: '',
    description: '',
    price: '',
    duration: '',
    is_active: true
  };
};

export const validateServiceForm = (values: ServiceFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.name) {
    errors.name = 'El nombre es obligatorio';
  }
  
  if (values.category === -1 || !values.category) {
    errors.category = 'Debe seleccionar una categoría';
  }
  
  if (!values.price) {
    errors.price = 'El precio es obligatorio';
  } else {
    const price = Number(values.price);
    if (isNaN(price) || price <= 0) {
      errors.price = 'El precio debe ser un número mayor que cero';
    }
  }
  
  if (!values.duration) {
    errors.duration = 'La duración es obligatoria';
  } else {
    const duration = Number(values.duration);
    if (isNaN(duration) || duration <= 0 || !Number.isInteger(duration)) {
      errors.duration = 'La duración debe ser un número entero mayor que cero';
    }
  }
  
  return errors;
};