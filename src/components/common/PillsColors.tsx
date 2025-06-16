const rolePillColors = [
  { bg: '#EFF6FF', text: '#1E40AF' }, // Azul claro con texto azul oscuro
  { bg: '#F0FDF4', text: '#166534' }, // Verde claro con texto verde oscuro
  { bg: '#FDF2F8', text: '#BE185D' }, // Rosa claro con texto rosa oscuro
  { bg: '#FFFBEB', text: '#C2410C' }, // Amarillo claro con texto naranja oscuro
  { bg: '#F5F3FF', text: '#7C3AED' }, // Violeta claro con texto violeta oscuro
  { bg: '#1F2937', text: '#FFFFFF' }, // Gris oscuro con texto blanco
  { bg: '#064E3B', text: '#FFFFFF' }, // Verde oscuro con texto blanco
  { bg: '#7C2D12', text: '#FFFFFF' }, // Marrón oscuro con texto blanco
];

// Asignar un color consistente basado en el nombre del rol
export const getRolePillColor = (roleName: string) => {
  const charSum = roleName.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return rolePillColors[charSum % rolePillColors.length];
};