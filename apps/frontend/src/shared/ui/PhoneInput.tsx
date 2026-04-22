import React from 'react';
import { IMaskInput } from 'react-imask';
import { Input, InputProps } from './Input';

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(({
    error,
    className = '',
    ...props
}, ref) => {
    return (
        <IMaskInput
            {...(props as any)}
            inputRef={(el: HTMLInputElement | null) => {
                if (typeof ref === 'function') ref(el);
                else if (ref) (ref as any).current = el;
            }}
            mask="00 00000000"
            lazy={true}
            placeholder="06 12345678"
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${className}`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            onInput={(e: any) => {
                const input = e.target as HTMLInputElement;
                let val = input.value;
                if (val.startsWith('+31')) {
                    input.value = '0' + val.substring(3).replace(/\D/g, '');
                } else if (val.startsWith('31')) {
                    input.value = '0' + val.substring(2).replace(/\D/g, '');
                }
            }}
            onAccept={(value: string) => {
                props.onChange?.({ target: { value, name: props.name } } as any);
            }}
            suppressHydrationWarning={true}
        />
    );
});

PhoneInput.displayName = 'PhoneInput';
