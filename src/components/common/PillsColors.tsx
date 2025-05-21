  const rolePillColors = [
    { bg: '#E0F2FE', text: '#0369A1' }, // Azul claro
    { bg: '#D1FAE5', text: '#059669' }, // Verde claro
    { bg: '#FCE7F3', text: '#DB2777' }, // Rosa claro
    { bg: '#FEF3C7', text: '#D97706' }, // Amarillo claro
    { bg: '#E0E7FF', text: '#4F46E5' }, // Indigo claro
  ];

  // Asignar un color consistente basado en el nombre del rol
  export const getRolePillColor = (roleName: string) => {
    const charSum = roleName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return rolePillColors[charSum % rolePillColors.length];
  };

  