'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useGuardAccess } from '@/components/ui/admin/AdminGuardClient';

interface AdminVisibilityToggleProps {
    isVisible: boolean;
    onToggle: () => void;
    isPending?: boolean;
    label?: React.ReactNode;
    disabled?: boolean;
}

export default function AdminVisibilityToggle({
    isVisible,
    onToggle,
    isPending = false,
    label = "Zichtbaarheid",
    disabled = false
}: AdminVisibilityToggleProps) {
    const { canToggleVisibility } = useGuardAccess();

    if (!canToggleVisibility) {
        return null;
    }

    return (
        <div className={`flex items-center gap-1.5 rounded-full border border-border-color bg-bg-card px-2.5 py-1.5 shadow-sm sm:gap-3 sm:rounded-3xl sm:px-4 sm:py-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <span className="text-[11px] font-semibold whitespace-nowrap text-text-muted sm:text-base">
                {label}
            </span>
            <button
                type="button"
                onClick={onToggle}
                disabled={isPending || disabled}
                aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                className={`relative flex h-5 w-9 shrink-0 items-center rounded-full p-1 transition-all sm:h-6 sm:w-12 ${
                    isVisible ? 'bg-beheer-active' : 'bg-beheer-inactive'
                } hover:opacity-90 active:scale-95 disabled:opacity-50`}
            >
                {isPending ? (
                    <Loader2 className="mx-auto size-3 animate-spin text-white sm:size-4" />
                ) : (
                    <div
                        className={`size-3 rounded-full bg-white transition-transform sm:size-4 ${
                            isVisible ? 'translate-x-4 sm:translate-x-6' : 'translate-x-0'
                        } shadow-sm`}
                    />
                )}
            </button>
        </div>
    );
}