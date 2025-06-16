import './avatar.css';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  firstName = '', 
  lastName = '', 
  size = 'medium',
  className = '' 
}) => {
  // Generar iniciales
  const getInitials = (first: string, last: string): string => {
    const firstInitial = first?.charAt(0)?.toUpperCase() || '';
    const lastInitial = last?.charAt(0)?.toUpperCase() || '';
    
    if (firstInitial && lastInitial) {
      return firstInitial + lastInitial;
    } else if (firstInitial) {
      return firstInitial;
    } else {
      return 'U'; // Default para "Usuario"
    }
  };

  // Generar color de fondo basado en las iniciales
  const getBackgroundColor = (initials: string): string => {
    const colors = [
      '#0d9488', // teal-600
      '#0891b2', // sky-600
      '#7c3aed', // violet-600
      '#dc2626', // red-600
      '#ea580c', // orange-600
      '#65a30d', // lime-600
      '#c026d3', // fuchsia-600
      '#2563eb', // blue-600
      '#059669', // emerald-600
      '#7c2d12', // amber-800
    ];
    
    // Usar código ASCII de las iniciales para seleccionar color
    const charCodes = initials.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return colors[charCodes % colors.length];
  };

  const initials = getInitials(firstName, lastName);
  const backgroundColor = getBackgroundColor(initials);

  return (
    <div 
      className={`avatar avatar-${size} ${className}`}
      style={{ backgroundColor }}
    >
      <span className="avatar-initials">{initials}</span>
    </div>
  );
};

export default Avatar;