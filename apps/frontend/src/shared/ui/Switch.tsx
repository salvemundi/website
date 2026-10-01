'use client';

interface SwitchProps {
    checked?: boolean;
    onChange?: (checked: boolean) => void;
    disabled?: boolean;
    ariaLabel?: string;
    className?: string;
}

export function Switch({
    checked = false,
    onChange,
    disabled = false,
    ariaLabel = 'Schakelaar',
    className = ''
}: SwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={() => !disabled && onChange?.(!checked)}
            className={`tab-button form-switch ${checked ? 'active' : ''} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        >
            <span className="form-switch-thumb" />
        </button>
    );
}
