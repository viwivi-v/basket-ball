
import React from 'react';

interface DigitProps {
  value: string | number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const Digit: React.FC<DigitProps> = ({ value, size = 'md', color = 'text-amber-400', className = '' }) => {
  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl md:text-8xl',
    xl: 'text-8xl md:text-9xl lg:text-[12rem]',
  };

  return (
    <div className={`font-digital select-none tabular-nums ${sizeClasses[size]} ${color} ${className} drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]`}>
      {value}
    </div>
  );
};

export default Digit;
