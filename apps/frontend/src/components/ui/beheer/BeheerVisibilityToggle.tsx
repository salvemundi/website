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
        <div className="visibility-toggle-container" data-disabled={disabled}>
            <span className="form-label">
                {label}
            </span>
            <button
                type="button"
                onClick={onToggle}
                disabled={isPending || disabled}
                data-active={isVisible}
                aria-label={typeof label === 'string' ? label : 'Toggle zichtbaarheid'}
                className="btn-toggle-switch"
            >
                {isPending ? (
                    <Loader2 className="loader-spinner-sm" />
                ) : (
                    <span
                        data-active={isVisible}
                        className="visibility-toggle-thumb"
                    />
                )}
            </button>
        </div>
    );
}