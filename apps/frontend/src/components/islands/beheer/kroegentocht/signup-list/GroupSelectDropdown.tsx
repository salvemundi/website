'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (!buttonRef.current) return;
        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = menuRef.current?.offsetHeight ?? 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < menuHeight + 8 && rect.top > menuHeight + 8;

        setMenuStyle({
            position: 'fixed',
            right: window.innerWidth - rect.right,
            ...(openUpward
                ? { bottom: window.innerHeight - rect.top + 4 }
                : { top: rect.bottom + 4 }),
            width: 192,
            zIndex: 9999,
        });
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        updatePosition();
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('scroll', updatePosition, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isOpen, updatePosition]);

    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                buttonRef.current?.contains(event.target as Node) ||
                menuRef.current?.contains(event.target as Node)
            ) return;
            setIsOpen(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const selectedLabel = value || placeholder;

    return (
        <div className={`relative inline-block text-left ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                className={`tab-button flex items-center justify-between gap-1.5 rounded-lg border border-(--border-color)/30 bg-(--bg-main)/50 font-semibold text-(--text-main) transition-colors hover:border-(--theme-purple)/40 focus:outline-none ${
                    size === 'xs' ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs'
                }`}
            >
                <span className="max-w-30 truncate">{selectedLabel}</span>
                <ChevronDown className={`size-3 text-(--text-muted) transition-transform duration-200 ${isOpen ? 'rotate-180 text-(--theme-purple)' : ''}`} />
            </button>

            {isOpen && typeof window !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    style={menuStyle}
                    className="animate-in fade-in slide-in-from-top-1 rounded-xl border border-(--border-color)/30 bg-(--bg-card) p-1 shadow-xl ring-1 ring-black/5 duration-100 focus:outline-none"
                >
                    <div className="max-h-80 space-y-0.5 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => { onChange(null); setIsOpen(false); }}
                            className={`tab-button flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                !value
                                    ? 'bg-(--theme-purple) font-bold text-white'
                                    : 'bg-transparent text-(--text-muted) hover:bg-(--bg-main) hover:text-(--text-main)'
                            }`}
                        >
                            <span>{placeholder}</span>
                        </button>
                        {options.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => { onChange(option); setIsOpen(false); }}
                                className={`tab-button flex w-full cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                                    value === option
                                        ? 'bg-(--theme-purple) font-bold text-white'
                                        : 'bg-transparent text-(--text-main) hover:bg-(--bg-main)'
                                }`}
                            >
                                <span>{option}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
