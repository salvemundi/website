import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    variant?: 'gradient' | 'card';
    padding?: string;
    onClick?: () => void;
}

export default function Card({ 
    children, 
    className = '', 
    variant = 'gradient',
    padding = 'p-6',
    onClick 
}: CardProps) {
    const baseClasses = 'rounded-3xl shadow-lg transition-all';
    const variantClasses = variant === 'gradient' 
        ? 'bg-gradient-theme text-theme-white' 
        : 'bg-[var(--bg-card)]';
    const hoverClasses = onClick ? 'hover:shadow-xl hover:-translate-y-0.5 cursor-pointer' : '';
    
    return (
        <div 
            className={`${baseClasses} ${variantClasses} ${padding} ${hoverClasses} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
