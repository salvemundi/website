import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';

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
    placeholder?: string;
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
    max,
    placeholder
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [localTime, setLocalTime] = useState<string>(() => {
        const initialVal = value ?? defaultValue ?? '';
        return typeof initialVal === 'string' ? initialVal : '';
    });
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const containerRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const hourContainerRef = useRef<HTMLDivElement>(null);
    const minuteContainerRef = useRef<HTMLDivElement>(null);
    const selectedHourRef = useRef<HTMLButtonElement>(null);
    const selectedMinuteRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (value !== undefined) {
            setLocalTime(typeof value === 'string' ? value : '');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                containerRef.current?.contains(target) ||
                portalRef.current?.contains(target)
            ) {
                return;
            }
            setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateCoords = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = 224; // h-56 is 14rem = 224px
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;

            const openUpwards = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

            setCoords({
                top: openUpwards 
                    ? rect.top + window.scrollY - dropdownHeight - 8 
                    : rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            window.addEventListener('resize', updateCoords);
            window.addEventListener('scroll', updateCoords, { passive: true });

            return () => {
                window.removeEventListener('resize', updateCoords);
                window.removeEventListener('scroll', updateCoords);
            };
        }
    }, [isOpen, updateCoords]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                selectedHourRef.current?.scrollIntoView({ block: 'nearest' });
                selectedMinuteRef.current?.scrollIntoView({ block: 'nearest' });
            }, 50);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const parsed = useMemo(() => {
        if (!localTime) return { hour: undefined, minute: undefined };
        const parts = localTime.split(':');
        return {
            hour: parts[0] || undefined,
            minute: parts[1] || undefined
        };
    }, [localTime]);

    const selectedHour = parsed.hour;
    const selectedMinute = parsed.minute;

    const displayTime = useMemo(() => {
        if (!localTime) return '';
        return localTime.substring(0, 5); // Keep HH:mm
    }, [localTime]);

    const triggerChange = (newTime: string) => {
        if (onChange) {
            const event = {
                target: {
                    name,
                    id,
                    value: newTime
                },
                currentTarget: {
                    name,
                    id,
                    value: newTime
                }
            } as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
        }
    };

    const handleHourSelect = (h: string) => {
        const currentMin = selectedMinute ?? '00';
        const newTime = `${h}:${currentMin}`;
        if (value === undefined) {
            setLocalTime(newTime);
        }
        triggerChange(newTime);
    };

    const handleMinuteSelect = (m: string) => {
        const currentHour = selectedHour ?? '12';
        const newTime = `${currentHour}:${m}`;
        if (value === undefined) {
            setLocalTime(newTime);
        }
        triggerChange(newTime);
        setIsOpen(false);
    };

    const isHourDisabled = (h: string) => {
        if (min && typeof min === 'string') {
            const [minH] = min.split(':');
            if (parseInt(h) < parseInt(minH || '0')) return true;
        }
        if (max && typeof max === 'string') {
            const [maxH] = max.split(':');
            if (parseInt(h) > parseInt(maxH || '23')) return true;
        }
        return false;
    };

    const isMinuteDisabled = (m: string) => {
        const activeHour = selectedHour ?? (min && typeof min === 'string' ? min.split(':')[0] : '12');
        if (min && typeof min === 'string') {
            const [minH, minM] = min.split(':');
            if (parseInt(activeHour) < parseInt(minH || '0')) return true;
            if (parseInt(activeHour) === parseInt(minH || '0') && parseInt(m) < parseInt(minM || '0')) return true;
        }
        if (max && typeof max === 'string') {
            const [maxH, maxM] = max.split(':');
            if (parseInt(activeHour) > parseInt(maxH || '23')) return true;
            if (parseInt(activeHour) === parseInt(maxH || '23') && parseInt(m) > parseInt(maxM || '0')) return true;
        }
        return false;
    };

    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    const toggleDropdown = () => {
        if (!disabled) {
            if (!isOpen) {
                updateCoords();
            }
            setIsOpen(!isOpen);
        }
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                disabled={disabled}
                className={`beheer-input pr-10 text-left cursor-pointer transition-all ${
                    error ? 'border-red-500 ring-4 ring-red-500/10' : ''
                } ${className}`}
            >
                <span className={displayTime ? 'text-(--beheer-text)' : 'text-(--beheer-text-muted) opacity-60 font-medium'}>
                    {displayTime || placeholder || '--:--'}
                </span>
            </button>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-(--beheer-text-muted) opacity-60">
                <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                </svg>
            </div>
            <input
                type="hidden"
                id={id}
                name={name}
                value={displayTime}
                ref={ref}
            />

            {mounted && isOpen && createPortal(
                <div 
                    ref={portalRef}
                    style={{
                        position: 'absolute',
                        top: `${coords.top + 4}px`,
                        left: `${coords.left}px`,
                        width: `${Math.max(coords.width, 140)}px`,
                        zIndex: 999999
                    }}
                    className="bg-(--beheer-card-bg) border border-(--beheer-border) rounded-xl shadow-(--shadow-card-elevated) overflow-hidden animate-in fade-in zoom-in-95 duration-150 ease-out flex flex-col h-56"
                >
                    {/* Column Headers */}
                    <div className="flex text-[9px] font-extrabold tracking-widest text-(--beheer-text-muted) border-b border-(--beheer-border) bg-(--beheer-card-soft)/30 select-none">
                        <div className="flex-1 text-center py-1 border-r border-(--beheer-border)">UUR</div>
                        <div className="flex-1 text-center py-1">MIN</div>
                    </div>
                    
                    {/* Columns Container */}
                    <div className="flex flex-1 overflow-hidden divide-x divide-(--beheer-border)">
                        {/* Hours List */}
                        <div 
                            ref={hourContainerRef}
                            className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-0.5 h-full"
                        >
                            {hours.map(h => {
                                const isSelected = h === selectedHour;
                                const isDisabled = isHourDisabled(h);
                                return (
                                    <button
                                        key={h}
                                        ref={isSelected ? selectedHourRef : null}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleHourSelect(h)}
                                        className={`w-full text-center py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                            isSelected
                                                ? 'bg-(--beheer-accent) text-white'
                                                : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                        }`}
                                    >
                                        {h}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Minutes List */}
                        <div 
                            ref={minuteContainerRef}
                            className="flex-1 overflow-y-auto custom-scrollbar p-1 space-y-0.5 h-full"
                        >
                            {minutes.map(m => {
                                const isSelected = m === selectedMinute;
                                const isDisabled = isMinuteDisabled(m);
                                return (
                                    <button
                                        key={m}
                                        ref={isSelected ? selectedMinuteRef : null}
                                        type="button"
                                        disabled={isDisabled}
                                        onClick={() => handleMinuteSelect(m)}
                                        className={`w-full text-center py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                            isSelected
                                                ? 'bg-(--beheer-accent) text-white'
                                                : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                        }`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});

AdminTimepicker.displayName = 'AdminTimepicker';
