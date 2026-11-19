'use client';

import React from 'react';
import { Stack, Text, TextInput } from '@mantine/core';
import { PhoneInput } from '@/shared/ui/PhoneInput';

interface GuestTabProps {
    name: string;
    email: string;
    phone: string;
    onNameChange: (val: string) => void;
    onEmailChange: (val: string) => void;
    onPhoneChange: (val: string) => void;
}

export default function GuestTab({
    name,
    email,
    phone,
    onNameChange,
    onEmailChange,
    onPhoneChange
}: GuestTabProps) {
    return (
        <Stack gap="md">
            <TextInput
                label="Naam Gast"
                required
                value={name}
                onChange={(e) => onNameChange(e.currentTarget.value)}
                placeholder="Volledige naam"
                autoComplete="off"
                suppressHydrationWarning
            />
            <TextInput
                label="E-mailadres"
                type="email"
                required
                value={email}
                onChange={(e) => onEmailChange(e.currentTarget.value)}
                placeholder="email@voorbeeld.nl"
                autoComplete="off"
                suppressHydrationWarning
            />
            <Stack gap={4}>
                <Text size="sm" fw={500}>Telefoonnummer</Text>
                <PhoneInput
                    value={phone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="Optioneel"
                />
            </Stack>
        </Stack>
    );
}
