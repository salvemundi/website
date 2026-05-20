'use client';

import React from 'react';
import { IMaskInput } from 'react-imask';
import { type InputProps } from './Input';
import { useFormField } from './FormField';

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
    const { inputId: contextId } = useFormField();
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
            mask="00-00-0000"
            lazy={true}
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