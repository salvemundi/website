'use client';

import React from 'react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    className?: string;
    id?: string; // Optional manual ID override
    labelClassName?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    error,
    children,
    className = '',
    id,
    labelClassName = '',
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label htmlFor={id} className={`form-label mb-0 ${labelClassName}`}>
                {label} {required && <span className="text-theme-error">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-theme-error text-xs font-bold">
                    {error}
                </p>
            )}
        </div>
    );
};
