import { Group } from '../hooks/useGroups';

export interface RoleFormValues {
  name: string;
}

export const getInitialRoleFormValues = (role: Group | null): RoleFormValues => {
  if (role) {
    return {
      name: role.name,
    };
  }
  
  return {
    name: '',
  };
};

export const validateRoleForm = (values: RoleFormValues): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!values.name) {
    errors.name = 'El nombre del rol es obligatorio';
  }
  
  return errors;
};