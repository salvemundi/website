'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface AdminVisibilityToggleProps {
    isVisible: boolean;
    onToggle: () => void;
    isPending?: boolean;
    label?: React.ReactNode;
    disabled?: boolean;
}

/**
 * A standardized toggle for controlling page visibility on the public site.
 */
export default function AdminVisibilityToggle({
    isVisible,
    onToggle,
    isPending = false,
    label = "Zichtbaarheid",
    disabled = false
}: AdminVisibilityToggleProps) {
    return (
        <div className={`flex items-center gap-3 px-4 py-2 bg-bg-card border border-border-color rounded-3xl shadow-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <span className="text-base font-semibold text-text-muted">
                {label}
            </span>
            <button
                type="button"
                onClick={onToggle}
                disabled={isPending || disabled}
                aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                className={`w-12 h-6 rounded-full p-1 transition-all relative flex items-center ${
                    isVisible ? 'bg-beheer-active' : 'bg-beheer-inactive'
                } disabled:opacity-50 hover:opacity-90 active:scale-95`}
            >
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-white mx-auto" />
                ) : (
                    <div 
                        className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            isVisible ? 'translate-x-[1.5rem]' : 'translate-x-0'
                        } shadow-sm`} 
                    />
                )}
            </button>
        </div>
    );
}
