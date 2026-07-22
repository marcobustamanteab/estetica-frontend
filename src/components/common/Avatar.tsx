import { useState } from 'react';
import './avatar.css';

interface AvatarProps {
  firstName?: string;
  lastName?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  profileImage?: string;
}

const COLORS = [
  '#0d9488', '#0891b2', '#7c3aed', '#dc2626',
  '#ea580c', '#65a30d', '#c026d3', '#2563eb',
  '#059669', '#7c2d12',
];

function getInitials(first: string, last: string): string {
  const a = first?.charAt(0)?.toUpperCase() || '';
  const b = last?.charAt(0)?.toUpperCase() || '';
  return a && b ? a + b : a || 'U';
}

function getBackgroundColor(initials: string): string {
  const sum = initials.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
}

const Avatar: React.FC<AvatarProps> = ({
  firstName = '',
  lastName = '',
  size = 'medium',
  className = '',
  profileImage,
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(firstName, lastName);
  const bg = getBackgroundColor(initials);

  if (profileImage && !imgError) {
    return (
      <div className={`avatar avatar-${size} ${className}`}>
        <img
          src={profileImage}
          alt={initials}
          className="avatar-img"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`avatar avatar-${size} ${className}`} style={{ backgroundColor: bg }}>
      <span className="avatar-initials">{initials}</span>
    </div>
  );
};

export default Avatar;
