import React from 'react';

/**
 * AdminDatepicker — Stripped for shadcn/ui migration.
 *
 * TODO: Replace with shadcn Popover + Calendar, or keep native <input type="date">.
 * The flowbite-react dependency has been removed.
 */

const toDateInputValue = (date?: Date | null): string => {
    if (!date || isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface AdminDatepickerProps {
    id?: string;
    disabled?: boolean;
    minDate?: Date;
    maxDate?: Date;
    value?: Date | null;
    onChange?: (date: Date | null) => void;
    className?: string;
    label?: string;
}

export const AdminDatepicker = React.forwardRef<HTMLInputElement, AdminDatepickerProps>(({
    className = '',
    id,
    disabled,
    minDate,
    maxDate,
    value,
    onChange,
}, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!val) {
            onChange?.(null);
            return;
        }
        const [y, m, d] = val.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
            onChange?.(new Date(y, m - 1, d));
        }
    };

    return (
        <input
            ref={ref}
            type="date"
            id={id}
            value={toDateInputValue(value)}
            min={toDateInputValue(minDate) || undefined}
            max={toDateInputValue(maxDate) || undefined}
            disabled={disabled}
            onChange={handleChange}
            className={className}
        />
    );
});

AdminDatepicker.displayName = 'AdminDatepicker';
