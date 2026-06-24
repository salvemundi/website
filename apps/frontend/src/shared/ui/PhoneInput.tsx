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
            prepare={(appended: string, masked: { value: string }) => {
                let val = appended;
                if (masked.value === '') {
                    if (val.startsWith('0')) {
                        val = '+31' + val.substring(1);
                    } else if (val.startsWith('31')) {
                        val = '+' + val;
                    } else if (val.length > 0 && val[0] >= '1' && val[0] <= '9') {
                        val = '+' + val;
                    }
                }
                return val;
            }}
            onAccept={(acceptedValue: string) => {
                props.onChange?.({ target: { value: acceptedValue, name: props.name ?? '' } } as unknown as React.ChangeEvent<HTMLInputElement>);
            }}
            suppressHydrationWarning={true}
        />
    );
});

PhoneInput.displayName = 'PhoneInput';