import React from 'react';

export interface AdminTimepickerProps {
    id?: string;
    name?: string;
    value?: string;
    defaultValue?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    error?: boolean;
    min?: string;
    max?: string;
    className?: string;
}

export const AdminTimepicker = React.forwardRef<HTMLInputElement, AdminTimepickerProps>(({
    className = '',
    value,
    defaultValue,
    onChange,
    id,
    name,
    disabled = false,
    error = false,
    min,
    max
}, ref) => {
    return (
        <input
            ref={ref}
            type="time"
            id={id}
            name={name}
            value={value !== undefined ? value.substring(0, 5) : undefined}
            defaultValue={defaultValue !== undefined ? defaultValue.substring(0, 5) : undefined}
            onChange={onChange}
            disabled={disabled}
            min={min}
            max={max}
            className={`beheer-input w-full ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''} ${className}`}
        />
    );
});

AdminTimepicker.displayName = 'AdminTimepicker';
