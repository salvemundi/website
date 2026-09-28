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
    const fieldContext = useFormFieldOptional();
    const inputId = id ?? fieldContext?.inputId;
    const isError = error ?? fieldContext?.hasError;

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
                className={`flex w-full items-center rounded-2xl bg-bg-soft transition-colors ${
                    isError ? 'ring-theme-error ring-2' : 'focus-within:ring-2 focus-within:ring-theme-purple/20'
                } ${className}`}
            >
                <button
                    ref={triggerRef}
                    type="button"
                    disabled={disabled}
                    onClick={toggleOpen}
                    className="flex h-14 shrink-0 cursor-pointer items-center gap-2 rounded-l-2xl border-r border-border-color/40 bg-bg-soft px-3.5 text-sm font-bold text-text-main transition-colors select-none hover:bg-black/5 focus:outline-none dark:hover:bg-white/5"
                    aria-label={`Selecteer land, huidig: ${countryDisplayName} (${selectedCountry.dialCode})`}
                    aria-expanded={isOpen}
                >
                    <span className="inline-flex items-center justify-center rounded-md bg-theme-purple/10 px-1.5 py-0.5 text-xs font-black tracking-wider text-theme-purple">
                        {selectedCountry.code}
                    </span>
                    <span className="text-sm font-bold text-text-main">{selectedCountry.dialCode}</span>
                    <ChevronDown className={`size-3.5 text-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-theme-purple' : ''}`} />
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
                    className="h-14 min-w-0 flex-1 rounded-r-2xl border-none bg-transparent px-4 text-base font-bold text-text-main placeholder:font-normal placeholder:text-text-muted/50 focus:outline-none"
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
                    className="animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border-color bg-bg-card shadow-2xl shadow-theme-purple/15 duration-150 ease-out"
                >
                    <div className="border-b border-border-color/60 bg-bg-soft/50 p-3">
                        <div className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-3 size-4 text-text-muted" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Zoek land of code..."
                                className="w-full rounded-xl border border-border-color/60 bg-bg-card py-2 pr-3 pl-9 text-sm font-semibold text-text-main placeholder:text-text-muted/60 focus:ring-2 focus:ring-theme-purple/30 focus:outline-none"
                            />
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-64 space-y-0.5 overflow-y-auto p-1.5">
                        {filteredCountries.length > 0 ? (
                            filteredCountries.map((c) => {
                                const isSelected = c.code === selectedCountry.code;
                                const countryName = getCountryName(c.code, 'nl');
                                return (
                                    <button
                                        key={c.code}
                                        type="button"
                                        onClick={() => handleSelectCountry(c)}
                                        className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                                            isSelected
                                                ? 'bg-theme-purple/10 font-bold text-theme-purple'
                                                : 'font-medium text-text-main hover:bg-bg-soft'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <span className="inline-flex min-w-8 items-center justify-center rounded-md bg-theme-purple/10 px-1.5 py-0.5 text-xs font-black tracking-wider text-theme-purple">
                                                {c.code}
                                            </span>
                                            <span className="truncate">{countryName}</span>
                                        </div>
                                        <div className="ml-2 flex shrink-0 items-center gap-2">
                                            <span className="text-xs font-bold text-text-muted">{c.dialCode}</span>
                                            {isSelected && <Check className="size-4 text-theme-purple" />}
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