'use client';

import React from 'react';
import { useFormFieldOptional } from './FormField';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
    className = '',
    error,
    autoComplete = 'off',
    suppressHydrationWarning = true,
    id,
    ...props
}, ref) => {
    const contextId = useFormFieldOptional()?.inputId;
    const inputId = id ?? contextId;

    return (
        <input
            ref={ref}
            id={inputId}
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${className}`}
            {...props}
            autoComplete={autoComplete}
            suppressHydrationWarning={suppressHydrationWarning}
        />
    );
});

Input.displayName = 'Input';