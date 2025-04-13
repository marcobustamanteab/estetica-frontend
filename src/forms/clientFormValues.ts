import { Client } from '../hooks/useClients';

export interface ClientFormValues {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: 'M' | 'F' | 'O' | ''; 
  birth_date: string; 
  address: string;    
  is_active: boolean;
}

export const getInitialClientFormValues = (client: Client | null): ClientFormValues => {
  if (client) {
    return {
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email,
      phone: client.phone || '',
      gender: client.gender || '',
      birth_date: client.birth_date || '',
      address: client.address || '',
      is_active: client.is_active
    };
  }
  
  return {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    gender: '',
    birth_date: '',
    address: '',
    is_active: true
  };
};

export const validateClientForm = (values: ClientFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.first_name) {
    errors.first_name = 'El nombre es obligatorio';
  }
  
  if (!values.last_name) {
    errors.last_name = 'El apellido es obligatorio';
  }
  
  if (!values.email) {
    errors.email = 'El correo electrónico es obligatorio';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Formato de correo electrónico inválido';
  }

  if (!values.gender) {
    errors.gender = 'Seleccione género';
  }
  
  if (values.birth_date) {
    const birthDate = new Date(values.birth_date);
    const today = new Date();
    if (birthDate > today) {
      errors.birth_date = 'La fecha de nacimiento no puede ser futura';
    }
  }
  
  return errors;
};