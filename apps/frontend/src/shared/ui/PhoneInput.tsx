'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';
import { type InputProps } from './Input';
import { useFormFieldOptional } from './FormField';
import {
    type Country,
    ALL_COUNTRIES,
    getCountryName,
    matchesCountrySearch,
    parsePhoneNumber
} from '@/shared/lib/countries';

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(({
    error,
    className = '',
    id,
    disabled = false,
    ...props
}, ref) => {
    const contextId = useFormFieldOptional()?.inputId;
    const inputId = id ?? contextId;

    const rawValue = typeof props.value === 'string' ? props.value : (props.value ? String(props.value) : '');

    const parsed = useMemo(() => parsePhoneNumber(rawValue), [rawValue]);
    const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
    const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);

    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 320 });

    const triggerRef = useRef<HTMLButtonElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (rawValue) {
            const currentParsed = parsePhoneNumber(rawValue);
            setSelectedCountry(currentParsed.country);
            setNationalNumber(currentParsed.nationalNumber);
        } else if (rawValue === '') {
            setNationalNumber('');
        }
    }, [rawValue]);

    const updateCoords = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const popoverHeight = 320;
            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const openUpwards = spaceBelow < popoverHeight && spaceAbove > spaceBelow;

            setCoords({
                top: openUpwards
                    ? rect.top + window.scrollY - popoverHeight - 8
                    : rect.bottom + window.scrollY + 8,
                left: Math.max(16, Math.min(rect.left + window.scrollX, window.innerWidth - 336)),
                width: Math.min(320, window.innerWidth - 32)
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
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const insideTrigger = triggerRef.current?.contains(target);
            const insidePortal = portalRef.current?.contains(target);

            if (!insideTrigger && !insidePortal) {
                setIsOpen(false);
                setSearchQuery('');
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setSearchQuery('');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    const emitChange = (country: Country, number: string) => {
        const cleanedNumber = number.trim();
        const fullValue = cleanedNumber ? `${country.dialCode} ${cleanedNumber}` : '';
        props.onChange?.({
            target: {
                value: fullValue,
                name: props.name ?? ''
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputVal = e.target.value;

        if (inputVal.startsWith('+') || inputVal.startsWith('00')) {
            const parsedPasted = parsePhoneNumber(inputVal);
            setSelectedCountry(parsedPasted.country);
            setNationalNumber(parsedPasted.nationalNumber);
            emitChange(parsedPasted.country, parsedPasted.nationalNumber);
            return;
        }

        let cleaned = inputVal;
        if (cleaned.startsWith('0') && cleaned.length > 1) {
            cleaned = cleaned.slice(1);
        }

        setNationalNumber(cleaned);
        emitChange(selectedCountry, cleaned);
    };

    const handleSelectCountry = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        emitChange(country, nationalNumber);
    };

    const toggleOpen = () => {
        if (!disabled) {
            if (!isOpen) {
                updateCoords();
            }
            setIsOpen((prev) => !prev);
        }
    };

    const filteredCountries = useMemo(() => {
        if (!searchQuery.trim()) return ALL_COUNTRIES;
        const query = searchQuery.toLowerCase().trim();
        return ALL_COUNTRIES.filter((c) => matchesCountrySearch(c.code, query) || c.dialCode.includes(query));
    }, [searchQuery]);

    const countryDisplayName = getCountryName(selectedCountry.code, 'nl');

    return (
        <div className="relative w-full">
            <div
                className={`flex items-center w-full rounded-2xl bg-bg-soft transition-all ${
                    error ? 'ring-2 ring-theme-error' : 'focus-within:ring-2 focus-within:ring-theme-purple/20'
                } ${className}`}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={toggleOpen}
                    className="flex items-center gap-2 px-3.5 h-14 bg-bg-soft hover:bg-black/5 dark:hover:bg-white/5 rounded-l-2xl border-r border-border-color/40 text-text-main font-bold text-sm transition-colors shrink-0 focus:outline-none cursor-pointer select-none"
                    aria-label={`Selecteer land, huidig: ${countryDisplayName} (${selectedCountry.dialCode})`}
                    aria-expanded={isOpen}
                >
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md bg-theme-purple/10 text-theme-purple font-black text-xs tracking-wider">
                        {selectedCountry.code}
                    </span>
                    <span className="font-bold text-sm text-text-main">{selectedCountry.dialCode}</span>
                    <ChevronDown className={`h-3.5 w-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-theme-purple' : ''}`} />
                </button>

                <input
                    {...props}
                    ref={ref}
                    id={inputId}
                    type="tel"
                    inputMode="tel"
                    autoComplete={props.autoComplete ?? 'tel-national'}
                    disabled={disabled}
                    placeholder={selectedCountry.placeholder}
                    value={nationalNumber}
                    onChange={handleNumberChange}
                    className="flex-1 h-14 px-4 bg-transparent border-none rounded-r-2xl font-bold text-text-main placeholder:text-text-muted/50 placeholder:font-normal focus:outline-none text-base"
                />
            </div>

            {mounted && isOpen && createPortal(
                <div
                    ref={portalRef}
                    style={{
                        position: 'absolute',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        zIndex: 999999
                    }}
                    className="bg-bg-card border border-border-color rounded-2xl shadow-2xl shadow-theme-purple/15 overflow-hidden animate-in fade-in zoom-in-95 duration-150 ease-out"
                >
                    <div className="p-3 border-b border-border-color/60 bg-bg-soft/50">
                        <div className="relative flex items-center">
                            <Search className="absolute left-3 h-4 w-4 text-text-muted pointer-events-none" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Zoek land of code..."
                                className="w-full pl-9 pr-3 py-2 bg-bg-card border border-border-color/60 rounded-xl text-sm font-semibold text-text-main placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-theme-purple/30"
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => {
                                const isSelected = c.code === selectedCountry.code;
                                const countryName = getCountryName(c.code, 'nl');
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => handleSelectCountry(c)}
                                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-colors cursor-pointer ${
                                            isSelected
                                                ? 'bg-theme-purple/10 text-theme-purple font-bold'
                                                : 'hover:bg-bg-soft text-text-main font-medium'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span className="inline-flex items-center justify-center min-w-8 px-1.5 py-0.5 rounded-md bg-theme-purple/10 text-theme-purple font-black text-xs tracking-wider">
                                                {c.code}
                                            </span>
                                            <span className="truncate">{countryName}</span>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                            <span className="font-bold text-xs text-text-muted">{c.dialCode}</span>
                                            {isSelected && <Check className="h-4 w-4 text-theme-purple" />}
                                        </div>
                                    </button>
                                );
                            })
                        ) : (
                            <div className="py-6 text-center text-xs font-semibold text-text-muted">
                                Geen landen gevonden voor &quot;{searchQuery}&quot;
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
});

PhoneInput.displayName = 'PhoneInput';