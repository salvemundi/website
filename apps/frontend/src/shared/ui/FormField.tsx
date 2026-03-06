'use client';

import React from 'react';

interface FormFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
    className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
    label,
    required,
    error,
    children,
    className = '',
}) => {
    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
            <label className="form-label mb-0">
                {label} {required && <span className="text-theme-error">*</span>}
            </label>
            {children}
            {error && (
                <p className="text-theme-error text-xs font-bold animate-in fade-in slide-in-from-right-2">
                    {error}
                </p>
            )}
        </div>
    );
};
