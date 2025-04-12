// src/forms/formValues.ts
import { User } from '../hooks/useUsers';

export interface UserFormValues {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
}

export const getInitialUserFormValues = (user: User | null): UserFormValues => {
  if (user) {
    return {
      username: user.username,
      email: user.email,
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff,
    };
  }
  
  return {
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
  };
};

export const validateUserForm = (values: UserFormValues, isEditing: boolean): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.username) {
    errors.username = 'El nombre de usuario es obligatorio';
  }
  
  if (!values.email) {
    errors.email = 'El correo electrónico es obligatorio';
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errors.email = 'Formato de correo electrónico inválido';
  }
  
  if (!isEditing && !values.password) {
    errors.password = 'La contraseña es obligatoria para nuevos usuarios';
  }
  
  return errors;
};