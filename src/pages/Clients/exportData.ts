  export const exportColumns = [
    { header: "Nombre", accessor: "first_name" },
    { header: "Apellido", accessor: "last_name" },
    { header: "Email", accessor: "email" },
    {
      header: "Teléfono",
      accessor: "phone",
      formatFn: (value: string | null) => value || "No disponible",
    },
    {
      header: "Género",
      accessor: "gender",
      formatFn: (value: string | null) => {
        if (value === "M") return "Masculino";
        if (value === "F") return "Femenino";
        if (value === "O") return "Otro";
        return "No especificado";
      },
    },
    {
      header: "Dirección",
      accessor: "address",
      formatFn: (value: string | null) => value || "No disponible",
    },
    // {
    //   header: "Fecha de Nacimiento",
    //   accessor: "birth_date",
    //   formatFn: (value: string | null) => value || "No disponible",
    // },
    // {
    //   header: "Estado",
    //   accessor: "is_active",
    //   formatFn: (value: boolean) => (value ? "Activo" : "Inactivo"),
    // },
    // { header: "Fecha de Creación", accessor: "created_at" },
    // { header: "Última Actualización", accessor: "updated_at" },
  ];