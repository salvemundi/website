import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'purple';
    rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
}

/**
 * Centraal Skeleton component voor pulse-animated placeholders.
 * Gebruikt in hybride componenten om CLS te voorkomen terwijl we code-duplicatie verminderen.
 */
export function Skeleton({ 
    className, 
    variant = 'default', 
    rounded = 'md',
    ...props 
}: SkeletonProps) {
    const baseClass = "animate-pulse";
    
    // Kleurenprofielen gebaseerd op de huisstijl
    const variants = {
        default: "bg-[var(--bg-soft)] opacity-40",
        purple: "bg-[var(--color-purple-500)]/10"
    };

    // Afronding utilities (shorthand voor Tailwind klassen)
    const rounding = {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl",
        "3xl": "rounded-3xl",
        full: "rounded-full"
    };

    return (
        <div 
            className={`${baseClass} ${variants[variant]} ${rounding[rounded]} ${className || ''}`} 
            aria-hidden="true"
            {...props}
        />
    );
}
