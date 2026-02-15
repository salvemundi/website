'use client';

import React from 'react';
import { PhoneNumberInput } from '../components/PhoneNumberInput';

interface PhoneInputProps {
    id?: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}

/**
 * Compatibility wrapper for PhoneInput that uses the new PhoneNumberInput
 * but preserves the ChangeEvent interface for existing form handlers.
 */
export const PhoneInput: React.FC<PhoneInputProps> = ({
    name,
    value,
    onChange,
    required = false,
    className = "",
    disabled = false
}) => {
    const handlePhoneNumberChange = (newValue: string | undefined) => {
        // Create a synthetic ChangeEvent for compatibility with existing handleChange functions
        const syntheticEvent = {
            target: {
                name,
                value: newValue || '',
                type: 'text'
            }
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(syntheticEvent);
    };

    return (
        <PhoneNumberInput
            value={value}
            onChange={handlePhoneNumberChange}
            required={required}
            className={className}
            disabled={disabled}
        />
    );
};
