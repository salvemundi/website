'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface GroupSelectDropdownProps {
    value: string;
    options: string[];
    onChange: (newValue: string | null) => void;
    placeholder?: string;
    className?: string;
    size?: 'sm' | 'xs';
}

export default function GroupSelectDropdown({
    value,
    options,
    onChange,
    placeholder = 'Niet ingedeeld',
    className = '',
    size = 'sm'
}: GroupSelectDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = value || placeholder;

    return (
        <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between gap-1.5 rounded-lg border border-[var(--border-color)]/30 bg-[var(--bg-main)]/50 font-semibold text-[var(--text-main)] transition-all hover:border-[var(--theme-purple)]/40 focus:outline-none active:scale-98 ${
                    size === 'xs' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
                }`}
            >
                <span className="truncate max-w-[120px]">{selectedLabel}</span>
                <ChevronDown className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${isOpen ? 'rotate-180 text-[var(--theme-purple)]' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-1 w-48 origin-top-right rounded-xl border border-[var(--border-color)]/30 bg-[var(--bg-card)] p-1 shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-100">
                    <div className="max-h-[80vh] overflow-y-auto space-y-0.5">
                        <button
                            type="button"
                            onClick={() => {
                                onChange(null);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                !value
                                    ? 'bg-[var(--theme-purple)] text-white'
                                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-main)] hover:text-[var(--text-main)]'
                            }`}
                        >
                            {placeholder}
                        </button>
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => {
                                    onChange(option);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                    value === option
                                        ? 'bg-[var(--theme-purple)] text-white'
                                        : 'text-[var(--text-main)] hover:bg-[var(--bg-main)]'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
