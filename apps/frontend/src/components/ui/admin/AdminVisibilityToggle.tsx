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
        <div className={`flex items-center gap-1.5 sm:gap-3 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-bg-card border border-border-color rounded-full sm:rounded-3xl shadow-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-[11px] sm:text-base font-semibold text-text-muted whitespace-nowrap">
                {label}
            </span>
            <button
                type="button"
                onClick={onToggle}
                disabled={isPending || disabled}
                aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                className={`w-9 h-5 sm:w-12 sm:h-6 rounded-full p-1 transition-all relative flex items-center shrink-0 ${
                    isVisible ? 'bg-beheer-active' : 'bg-beheer-inactive'
                } disabled:opacity-50 hover:opacity-90 active:scale-95`}
            >
                {isPending ? (
                    <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-white mx-auto" />
                ) : (
                    <div
                        className={`w-3 h-3 sm:w-4 sm:h-4 bg-white rounded-full transition-transform ${
                            isVisible ? 'translate-x-4 sm:translate-x-6' : 'translate-x-0'
                        } shadow-sm`}
                    />
                )}
            </button>
        </div>
    );
}