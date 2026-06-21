import React from 'react';
import { IMaskInput } from 'react-imask';
import { type InputProps } from './Input';
import { useFormFieldOptional } from './FormField';

export const PhoneInput = React.forwardRef<HTMLInputElement, InputProps>(({
    error,
    className = '',
    id,
    ...props
}, ref) => {
    const { value, ...rest } = props;
    const stringValue = (typeof value === 'number' ? String(value) : (Array.isArray(value) ? value.join('') : value)) as string | undefined;

    const contextId = useFormFieldOptional()?.inputId;
    const inputId = id ?? contextId;

    return (
        <IMaskInput
            {...rest}
            id={inputId}
            value={stringValue}
            inputRef={(el: HTMLInputElement | null) => {
                if (typeof ref === 'function') ref(el);
                else if (ref) (ref as React.RefObject<HTMLInputElement | null>).current = el;
            }}
            mask={[
                {
                    mask: '+{31} 6 00000000',
                    startsWith: '+316',
                    lazy: false,
                } as unknown as RegExp,
                {
                    mask: /^\+?[0-9\s\-()]{0,16}$/,
                }
            ]}
            lazy={false}
            placeholderChar="x"
            placeholder="+31 6 xxxxxxxx"
            className={`form-input ${error ? 'border-theme-error ring-1 ring-theme-error' : ''} ${className}`}
            type="tel"
            inputMode="tel"
            autoComplete="off"
            onInput={(e) => {
                const input = e.target as HTMLInputElement;
                let val = input.value;

                val = val.replace(/[^\d+\s\-()]/g, '');

                // Auto-conversion to E.164 international format
                if (val.startsWith('0')) {
                    val = '+31' + val.substring(1);
                } else if (val.startsWith('31') && !val.startsWith('+31')) {
                    val = '+' + val;
                } else if (val.length > 0 && !val.startsWith('+')) {
                    val = '+' + val;
                }

                input.value = val;
            }}
            onAccept={(acceptedValue: string) => {
                props.onChange?.({ target: { value: acceptedValue, name: props.name ?? '' } } as unknown as React.ChangeEvent<HTMLInputElement>);
            }}
            suppressHydrationWarning={true}
        />
    );
});

PhoneInput.displayName = 'PhoneInput';