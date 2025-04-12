import React from 'react';
import { PulseLoader } from 'react-spinners';

interface SpinnerProps {
  size?: number;
  color?: string;
  margin?: number;
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ 
  size = 15, 
  color = "#0F766E",
  margin = 2,
}) => {

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999
  };



  return (
    <div style={containerStyle}>
      <PulseLoader color={color} size={size} margin={margin} />
    </div>
  );
};

export default Spinner;