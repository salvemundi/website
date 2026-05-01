'use client';

import React from 'react';
import { IMaskInput } from 'react-imask';
import { Input, InputProps } from './Input';

export interface DateInputProps extends Omit<InputProps, 'onChange' | 'value'> {
    value?: string; // Expected in yyyy-mm-dd (DB format)
    onChange?: (value: string) => void;
    InputComponent?: React.ComponentType<InputProps>;
}

/**
 * A specialized Input component that forces dd-mm-yyyy format in the UI
 * while maintaining yyyy-mm-dd internally for database compatibility.
 * Optimized with react-imask for better autofill and event handling.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(({
    value = '',
    onChange,
    placeholder = 'dd-mm-jjjj',
    InputComponent = Input,
    error,
    ...props
}, ref) => {

    // Sync internal value (yyyy-mm-dd) to display value (dd-mm-yyyy)
    const formatDisplayValue = (val: string) => {
        if (!val) return '';
        const parts = val.split('-');
        if (parts.length === 3 && parts[0].length === 4) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return val;
    };

    const handleAccept = (maskedValue: string) => {
        if (maskedValue.length === 10) {
            const [d, m, y] = maskedValue.split('-');
            onChange?.(`${y}-${m}-${d}`);
        } else if (maskedValue.length === 0) {
            onChange?.('');
        }
    };

    return (
        <IMaskInput
            {...props}
            inputRef={(el: HTMLInputElement | null) => {
                if (typeof ref === 'function') ref(el);
                else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }}
            mask="00-00-0000"
            lazy={true}
            placeholder={placeholder}
            value={formatDisplayValue(value)}
            onAccept={handleAccept}
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${props.className || ''}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            suppressHydrationWarning={true}
        />
    );
});

DateInput.displayName = 'DateInput';
