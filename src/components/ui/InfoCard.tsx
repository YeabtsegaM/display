import React from 'react';

interface InfoCardProps {
  title: string;
  value: string | number;
  status?: 'success' | 'warning' | 'error' | 'info';
  className?: string;
  children?: React.ReactNode;
}

export function InfoCard({ 
  title, 
  value, 
  status = 'info',
  className = '',
  children
}: InfoCardProps) {
  const statusClasses = {
    success: 'text-emerald-300',
    warning: 'text-amber-300',
    error: 'text-red-300',
    info: 'text-white'
  };

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/10 shadow-lg w-32 h-16 flex flex-col justify-center ${className}`}>
      <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold text-center mb-1">
        {title}
      </div>
      <div className={`text-sm font-bold text-center ${statusClasses[status]}`}>
        {value}
      </div>
      {children}
    </div>
  );
} 