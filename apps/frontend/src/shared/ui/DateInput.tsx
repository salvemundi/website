'use client';

import React from 'react';
import { IMaskInput, IMask } from 'react-imask';
import { type InputProps } from './Input';
import { useFormFieldOptional } from './FormField';

export interface DateInputProps extends Omit<InputProps, 'onChange' | 'value'> {
    value?: string;
    onChange?: (value: string) => void;
}

export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(({
    value = '',
    onChange,
    placeholder = 'dd-mm-jjjj',
    error,
    id,
    ...props
}, ref) => {
    const contextId = useFormFieldOptional()?.inputId;
    const inputId = id ?? contextId;

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
        } else {
            onChange?.(maskedValue);
        }
    };

    return (
        <IMaskInput
            {...props}
            id={inputId}
            inputRef={(el: HTMLInputElement | null) => {
                if (typeof ref === 'function') ref(el);
                else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el;
            }}
            mask="d-m-Y"
            blocks={{
                d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
                m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
                Y: { mask: IMask.MaskedRange, from: new Date().getFullYear() - 100, to: new Date().getFullYear(), maxLength: 4 }
            }}
            lazy={false}
            placeholderChar="x"
            placeholder={placeholder}
            value={formatDisplayValue(value)}
            onAccept={handleAccept}
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${props.className ?? ''}`}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            suppressHydrationWarning={true}
        />
    );
});

DateInput.displayName = 'DateInput';