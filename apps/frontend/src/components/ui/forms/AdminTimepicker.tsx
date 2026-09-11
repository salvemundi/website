import React, { useEffect, useRef, useState } from 'react';

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
    const [localValue, setLocalValue] = useState((value ?? defaultValue ?? '').substring(0, 5));
    const isFocused = useRef(false);

    // Only pull in external value changes while the field isn't being actively
    // edited: the native time input reports "" for a segment that's mid-type
    // (e.g. hour filled, minute not yet), and syncing that straight back in
    // would blank out what the user just typed before they finish.
    // However, if value is explicitly empty or the input is disabled, always sync it.
    useEffect(() => {
        if (value !== undefined) {
            if (!value || disabled || !isFocused.current) {
                setLocalValue((value || '').substring(0, 5));
            }
        }
    }, [value, disabled]);

    return (
        <input
            ref={ref}
            type="time"
            id={id}
            name={name}
            value={localValue}
            onFocus={() => { isFocused.current = true; }}
            onBlur={() => { isFocused.current = false; }}
            onChange={(e) => {
                setLocalValue(e.target.value);
                onChange?.(e);
            }}
            disabled={disabled}
            min={min}
            max={max}
            title={disabled ? 'Selecteer eerst een datum' : undefined}
            className={`beheer-input w-full font-medium ${disabled ? 'opacity-40 cursor-not-allowed bg-neutral-500/10' : ''} ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''} ${className}`}
        />
    );
});

AdminTimepicker.displayName = 'AdminTimepicker';
