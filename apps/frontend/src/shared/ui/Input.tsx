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
    const fieldContext = useFormFieldOptional();
    const inputId = id ?? fieldContext?.inputId;
    const isError = error ?? fieldContext?.hasError;

    return (
        <input
            ref={ref}
            id={inputId}
            className={`form-input ${isError ? 'border-theme-error ring-theme-error ring-1' : ''} ${className}`}
            {...props}
            autoComplete={autoComplete}
            suppressHydrationWarning={suppressHydrationWarning}
        />
    );
});

Input.displayName = 'Input';