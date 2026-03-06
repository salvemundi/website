'use client';

import React from 'react';
import { Input, InputProps } from './Input';

export interface PhoneInputProps extends InputProps { }

export const PhoneInput: React.FC<PhoneInputProps> = ({
    maxLength = 20,
    type = 'tel',
    placeholder = '06 12345678',
    ...props
}) => {
    return (
        <Input
            type={type}
            maxLength={maxLength}
            placeholder={placeholder}
            {...props}
        />
    );
};
