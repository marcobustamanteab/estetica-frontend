import React, { useState, useEffect, useRef } from 'react';

interface CounterProps {
  end: number;
  duration?: number; // duración en ms
  prefix?: string;
  suffix?: string;
}

const Counter: React.FC<CounterProps> = ({ 
  end, 
  duration = 2000, 
  prefix = '', 
  suffix = '' 
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Reiniciar el contador si cambia el valor final
    countRef.current = 0;
    setCount(0);
    startTimeRef.current = null;
    
    // Función de animación con requestAnimationFrame
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = timestamp - startTimeRef.current;
      
      // Calcular el valor actual basado en el progreso
      const percentage = Math.min(progress / duration, 1);
      
      // Utilizar una función de easing para un efecto más natural
      const easedProgress = percentage === 1 ? 1 : 1 - Math.pow(1 - percentage, 3);
      
      // Actualizar el contador
      countRef.current = Math.floor(easedProgress * end);
      setCount(countRef.current);
      
      // Continuar la animación si no ha terminado
      if (progress < duration) {
        requestIdRef.current = requestAnimationFrame(animate);
      } else {
        // Asegurarse de que el valor final sea exactamente el esperado
        setCount(end);
      }
    };
    
    // Iniciar la animación
    requestIdRef.current = requestAnimationFrame(animate);
    
    // Limpiar al desmontar
    return () => {
      if (requestIdRef.current) {
        cancelAnimationFrame(requestIdRef.current);
      }
    };
  }, [end, duration]);
  
  return (
    <span className="counter-value">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

export default Counter;