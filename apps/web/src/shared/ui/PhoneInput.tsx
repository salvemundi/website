'use client';

import React from 'react';

/**
 * A generic phone number input component to ensure consistent settings (like maxLength)
 * across the entire application.
 */
interface PhoneInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    /** Additional custom styling if needed */
    className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
    maxLength = 20,
    type = 'tel',
    placeholder = '+31 6 12345678',
    className = '',
    ...props
}) => {
    return (
        <input
            type={type}
            maxLength={maxLength}
            placeholder={placeholder}
            className={className}
            {...props}
        />
    );
};
