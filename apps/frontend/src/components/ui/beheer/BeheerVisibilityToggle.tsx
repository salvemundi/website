'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { useGuardAccess } from '@/components/ui/beheer/BeheerGuardClient';

interface AdminVisibilityToggleProps {
    isVisible: boolean;
    onToggle: () => void;
    isPending?: boolean;
    label?: React.ReactNode;
    disabled?: boolean;
}

export default function BeheerVisibilityToggle({
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
        <div className={`flex items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-3 py-1.5 shadow-xs sm:gap-3 sm:px-4 sm:py-2 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <span className="text-xs font-semibold whitespace-nowrap text-(--beheer-text) sm:text-sm">
                {label}
            </span>
            <button
                type="button"
                onClick={onToggle}
                disabled={isPending || disabled}
                aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                className={`tab-button relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 outline-none ${
                    isVisible ? 'bg-(--beheer-active)' : 'bg-(--beheer-inactive)'
                } disabled:cursor-not-allowed disabled:opacity-50`}
            >
                {isPending ? (
                    <Loader2 className="mx-auto size-3.5 animate-spin text-white" />
                ) : (
                    <span
                        className={`pointer-events-none inline-block size-5 rounded-full bg-white shadow-xs transition-transform duration-200 ease-in-out ${
                            isVisible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                    />
                )}
            </button>
        </div>
    );
}