// src/components/common/SwitchToggle.tsx
import React from 'react';
import './switchToggle.css';

interface SwitchToggleProps {
  isActive: boolean;
  onChange: () => void;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}

const SwitchToggle: React.FC<SwitchToggleProps> = ({ 
  isActive, 
  onChange, 
  size = 'medium',
  disabled = false
}) => {
  return (
    <button
      className={`switch-button ${isActive ? 'on' : 'off'} ${size} ${disabled ? 'disabled' : ''}`}
      onClick={disabled ? undefined : onChange}
      role="switch"
      aria-checked={isActive}
      aria-disabled={disabled}
      disabled={disabled}
    >
      <span className="switch-button-slider"></span>
    </button>
  );
};

export default SwitchToggle;