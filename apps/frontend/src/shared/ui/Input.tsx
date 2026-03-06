'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input: React.FC<InputProps> = ({
    className = '',
    error,
    ...props
}) => {
    return (
        <input
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${className}`}
            {...props}
        />
    );
};
