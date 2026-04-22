'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    className = '',
    error,
    autoComplete = 'off',
    suppressHydrationWarning = true,
    ...props
}, ref) => {
    return (
        <input
            ref={ref}
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${className}`}
            {...props}
            autoComplete={autoComplete}
            suppressHydrationWarning={suppressHydrationWarning}
        />
    );
});

Input.displayName = 'Input';
