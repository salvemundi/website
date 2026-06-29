import React, { useState, useEffect } from 'react';
import { AdminDatepicker } from './AdminDatepicker';
import { AdminTimepicker } from './AdminTimepicker';

export interface AdminDatetimepickerProps {
    id?: string;
    name?: string;
    value?: string; // Format: YYYY-MM-DDTHH:mm
    defaultValue?: string; // Format: YYYY-MM-DDTHH:mm
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    min?: string;
    max?: string;
    className?: string;
    error?: boolean;
    dateLabel?: string;
    timeLabel?: string;
}

export const AdminDatetimepicker = React.forwardRef<HTMLInputElement, AdminDatetimepickerProps>(({
    id,
    name,
    value,
    defaultValue,
    onChange,
    min,
    max,
    className = '',
    error = false,
    dateLabel,
    timeLabel
}, ref) => {
    // Determine initial state
    const initialFullValue = value ?? defaultValue ?? '';
    
    // Parse Date and Time from ISO-like string "YYYY-MM-DDTHH:mm"
    const parseDateTime = (str: string) => {
        if (!str) return { date: null, time: '' };
        const parts = str.split('T');
        if (parts.length === 2) {
            const parsedDate = new Date(parts[0]);
            return {
                date: isNaN(parsedDate.getTime()) ? null : parsedDate,
                time: parts[1].substring(0, 5) // HH:mm
            };
        } else if (parts.length === 1) {
            const parsedDate = new Date(parts[0]);
            return {
                date: isNaN(parsedDate.getTime()) ? null : parsedDate,
                time: ''
            };
        }
        return { date: null, time: '' };
    };

    const initialParsed = parseDateTime(initialFullValue);
    
    // Use controlled or uncontrolled state based on `value` prop presence
    const [internalDate, setInternalDate] = useState<Date | null>(initialParsed.date);
    const [internalTime, setInternalTime] = useState<string>(initialParsed.time);
    
    // Update internal state if value prop changes
    useEffect(() => {
        if (value !== undefined) {
            const parsed = parseDateTime(value);
            setInternalDate(parsed.date);
            setInternalTime(parsed.time);
        }
    }, [value]);

    const hiddenInputRef = React.useRef<HTMLInputElement>(null);

    // Combine date and time to ISO string
    const toISODateString = (date: Date | null): string => {
        if (!date) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const combinedValue = React.useMemo(() => {
        if (!internalDate) return '';
        const dateStr = toISODateString(internalDate);
        const timeStr = internalTime || '00:00';
        return `${dateStr}T${timeStr}`;
    }, [internalDate, internalTime]);

    // Handle updates and trigger onChange
    const triggerChange = (newDate: Date | null, newTime: string) => {
        if (!onChange) return;
        
        let newCombined = '';
        if (newDate) {
            const dateStr = toISODateString(newDate);
            const timeStr = newTime || '00:00';
            newCombined = `${dateStr}T${timeStr}`;
        }
        
        // Create a synthetic event
        const event = {
            target: {
                name: name,
                value: newCombined
            },
            currentTarget: {
                name: name,
                value: newCombined
            }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onChange(event);
    };

    const handleDateChange = (date: Date | null) => {
        if (value === undefined) setInternalDate(date);
        triggerChange(date, internalTime);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = e.target.value;
        if (value === undefined) setInternalTime(time);
        triggerChange(internalDate, time);
    };

    // Calculate min/max for Datepicker (expects Date object)
    const minDate = min ? new Date(min.split('T')[0]) : undefined;
    const maxDate = max ? new Date(max.split('T')[0]) : undefined;

    return (
        <div className={`flex w-full items-start gap-3 ${className}`}>
            {/* Hidden input to ensure form submission works seamlessly */}
            <input 
                type="hidden" 
                id={id} 
                name={name} 
                value={combinedValue}
                ref={(node) => {
                    hiddenInputRef.current = node;
                    if (typeof ref === 'function') ref(node);
                    else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
                }}
            />
            
            <div className="flex-1 min-w-0">
                {dateLabel && <label htmlFor={id} className="block text-base font-semibold text-(--beheer-text-muted) mb-2">{dateLabel}</label>}
                <AdminDatepicker
                    value={internalDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    maxDate={maxDate}
                    className={`w-full ${error ? 'border-red-500' : ''}`}
                />
            </div>
            
            <div className="w-28 sm:w-32 shrink-0">
                {timeLabel ? (
                    <label className="block text-base font-semibold text-(--beheer-text-muted) mb-2">{timeLabel}</label>
                ) : (
                    dateLabel && <div className="h-6 mb-2"></div>
                )}
                <AdminTimepicker
                    value={internalTime}
                    onChange={handleTimeChange}
                    className={`w-full ${error ? 'border-red-500 ring-4 ring-red-500/10' : ''}`}
                />
            </div>
        </div>
    );
});

AdminDatetimepicker.displayName = 'AdminDatetimepicker';
