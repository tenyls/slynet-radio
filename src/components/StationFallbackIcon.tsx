import React from 'react';
import { SlyNetLogo } from './SlyNetLogo';

interface StationFallbackIconProps {
  className?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const StationFallbackIcon: React.FC<StationFallbackIconProps> = ({
  className = '',
  name = 'SlyNet Radio',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20',
    xl: 'w-56 h-56 sm:w-64 sm:h-64',
  }[size];

  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl overflow-hidden shrink-0 shadow-xl bg-gradient-to-br from-zinc-950 via-black to-zinc-950 border border-emerald-500/20 ${sizeClasses} ${className}`}
      title={name}
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 bg-radial from-emerald-500/10 via-transparent to-transparent pointer-events-none" />

      {/* Official Unified SlyNet Logo */}
      <SlyNetLogo size={size} className="w-full h-full rounded-2xl" />
    </div>
  );
};
