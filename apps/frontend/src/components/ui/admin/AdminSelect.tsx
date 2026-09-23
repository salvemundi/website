'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

export interface AdminSelectOption<T extends string | number = string | number> {
    value: T;
    label: string;
}

interface AdminSelectProps<T extends string | number = string | number> {
    name?: string;
    value?: T;
    defaultValue?: T;
    onChange?: (value: T) => void;
    options: AdminSelectOption<T>[];
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
}

export default function AdminSelect<T extends string | number = string | number>({
    name,
    value,
    defaultValue,
    onChange,
    options,
    className = '',
    placeholder = 'Selecteer...',
    disabled = false,
    size = 'md'
}: AdminSelectProps<T>) {
    const [isOpen, setIsOpen] = useState(false);
    const [localValue, setLocalValue] = useState<T | undefined>(value ?? defaultValue);
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | PointerEvent) => {
            const target = event.target as Node;
            const clickedInsideButton = dropdownRef.current?.contains(target);
            const clickedInsidePortal = portalRef.current?.contains(target);

            if (!clickedInsideButton && !clickedInsidePortal) {
                setIsOpen(false);
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, []);

    const updateCoords = useCallback(() => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownHeight = options.length === 0
                ? 40
                : Math.min(options.length * 34 + 10, 250);
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
    }, [options.length]);

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
        if (value !== undefined) {
            setLocalValue(value);
        }
    }, [value]);

    const selectedOption = options.find(opt => opt.value === localValue);

    const toggleDropdown = () => {
        if (!disabled) {
            if (!isOpen) {
                updateCoords();
            }
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (val: T) => {
        if (value === undefined) {
            setLocalValue(val);
        }
        onChange?.(val);
        setIsOpen(false);
    };

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            {name && (
                <input type="hidden" name={name} value={localValue ?? ''} />
            )}
            <button
                ref={buttonRef}
                type="button"
                onClick={toggleDropdown}
                disabled={disabled}
                className={`active:scale-0.98 flex w-full cursor-pointer items-center justify-between rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) text-left font-semibold text-(--beheer-text) transition-all duration-200 outline-none hover:border-(--beheer-accent)/50 disabled:cursor-not-allowed disabled:opacity-50 ${
                    size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
                }`}
            >
                <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`size-4 shrink-0 text-(--beheer-text-muted) transition-transform duration-300 ${isOpen ? 'rotate-180 text-(--beheer-accent)' : ''}`} />
            </button>

            {mounted && isOpen && createPortal(
                <div 
                    ref={portalRef}
                    style={{
                        position: 'absolute',
                        top: `${coords.top + 4}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        zIndex: 999999
                    }}
                    className="animate-in fade-in zoom-in-95 overflow-hidden rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) shadow-(--shadow-card-elevated) duration-150 ease-out"
                >
                    <div className="custom-scrollbar max-h-60 space-y-0.5 overflow-y-auto p-1">
                        {options.length === 0 ? (
                            <div className="px-3 py-2 text-center text-xs font-semibold text-(--beheer-text-muted) italic">
                                Geen opties beschikbaar
                            </div>
                        ) : (
                            options.map((option) => {
                                const isSelected = option.value === localValue;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => handleSelect(option.value)}
                                        className={`w-full cursor-pointer rounded-lg px-3 py-2 text-left text-xs font-semibold transition-all ${
                                            isSelected
                                                ? 'bg-(--beheer-accent) text-white'
                                                : 'text-(--beheer-text-muted) hover:bg-(--beheer-card-soft) hover:text-(--beheer-text)'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
