import React, { useState, useEffect } from "react";
import { User, UserFormData } from "../../hooks/useUsers";
import { useGroups } from "../../hooks/useGroups";
import "../common/modal.css";
import "../../assets/styles/users/userFormModal.css";

interface UserFormModalProps {
  user: User | null;
  onClose: () => void;
  onSave: (userData: UserFormData) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<UserFormData>({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    is_active: true,
    is_staff: false,
    groups: [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const { groups, fetchGroups, loading: groupsLoading } = useGroups();

  // Cargar roles disponibles al montar el componente
  useEffect(() => {
    fetchGroups();
  }, []);

  // Si estamos editando, cargar los datos del usuario
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        is_active: user.is_active,
        is_staff: user.is_staff,
        groups: user.groups
          ? user.groups.map((group) =>
              typeof group === "object" ? group.id : group
            )
          : [],
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;

    // Manejar los checkboxes
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Manejar cambios en la selección de roles
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value)
    );

    setFormData((prev) => ({
      ...prev,
      groups: selectedOptions,
    }));
  };

  // Cambio en checkbox de administrador
  const handleStaffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isStaff = e.target.checked;

    setFormData((prev) => ({
      ...prev,
      is_staff: isStaff,
      // If administrator, clear assigned roles
      groups: isStaff ? [] : prev.groups,
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username)
      newErrors.username = "El nombre de usuario es obligatorio";
    if (!formData.email)
      newErrors.email = "El correo electrónico es obligatorio";
    if (!user && !formData.password)
      newErrors.password = "La contraseña es obligatoria para nuevos usuarios";
    if (!formData.first_name) newErrors.first_name = "El nombre es obligatorio";
    if (!formData.last_name) newErrors.last_name = "El apellido es obligatorio";

    // Validación de formato de email
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Formato de correo electrónico inválido";
    }

    // Validar rol si no es administrador
    if (
      !formData.is_staff &&
      (!formData.groups || formData.groups.length === 0)
    ) {
      newErrors.groups = "Debe seleccionar al menos un rol";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Si estamos editando y no se cambió la contraseña, no la enviamos
    if (user && !formData.password) {
      // Crear un nuevo objeto sin el campo 'password'
      const dataWithoutPassword = { ...formData };
      delete dataWithoutPassword.password;
      onSave(dataWithoutPassword);
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container user-form-modal">
        <div className="modal-header">
          <h3>{user ? "Editar Usuario" : "Nuevo Usuario"}</h3>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">
                Nombre de Usuario <span className="required">*</span>
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={errors.username ? "form-input error" : "form-input"}
                required
              />
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Correo Electrónico <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? "form-input error" : "form-input"}
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                Nombre <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className={
                  errors.first_name ? "form-input error" : "form-input"
                }
                required
              />
              {errors.first_name && (
                <span className="error-message">{errors.first_name}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Apellido <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className={errors.last_name ? "form-input error" : "form-input"}
                required
              />
              {errors.last_name && (
                <span className="error-message">{errors.last_name}</span>
              )}
            </div>
          </div>

          {/* Solo mostrar el campo de contraseña para nuevos usuarios o si se quiere cambiar */}
          <div className="form-group">
            <label htmlFor="password">
              {user
                ? "Contraseña (dejar en blanco para mantener la actual)"
                : "Contraseña"}{" "}
              {!user && <span className="required">*</span>}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password || ""}
              onChange={handleChange}
              className={errors.password ? "form-input error" : "form-input"}
              required={!user}
            />
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Checkboxes en la misma línea */}
          <div className="form-row checkbox-container">
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                />
                <span className="checkbox-text">Usuario Activo</span>
              </label>
            </div>

            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_staff"
                  checked={formData.is_staff}
                  onChange={handleStaffChange}
                />
                <span className="checkbox-text">Administrador</span>
              </label>
              {formData.is_staff && (
                <div className="admin-help-text">
                  Al habilitar esta opción, el usuario tendrá acceso completo al
                  sistema.
                </div>
              )}
            </div>
          </div>

          {/* Selector de roles (solo visible si no es administrador) */}
          {!formData.is_staff && (
            <div className="form-group roles-group">
              <label htmlFor="groups">
                Roles <span className="required">*</span>
                <span className="help-text"> (Selecciona uno o más roles)</span>
              </label>
              {groupsLoading ? (
                <div className="loading-roles">Cargando roles...</div>
              ) : (
                <>
                  <select
                    id="groups"
                    name="groups"
                    multiple
                    value={
                      formData.groups
                        ? formData.groups.map((id) => id.toString())
                        : []
                    }
                    onChange={handleRoleChange}
                    className={
                      errors.groups
                        ? "form-input error roles-select"
                        : "form-input roles-select"
                    }
                    size={Math.min(4, groups.length || 1)}
                  >
                    {groups.map((group) => (
                      <option key={group.id} value={group.id.toString()}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                  {errors.groups && (
                    <span className="error-message">{errors.groups}</span>
                  )}
                  <span className="select-help">
                    Mantén presionado Ctrl (o Cmd en Mac) para seleccionar
                    múltiples roles
                  </span>
                </>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="save-button">
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
