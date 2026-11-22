import React from 'react';
import { Check } from 'lucide-react';
import { Paper, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { type EnrichedUser } from '@/types/auth';

interface RegistrationSuccessProps {
    currentUser: EnrichedUser | null;
    email?: string;
}

export function RegistrationSuccess({ currentUser, email }: RegistrationSuccessProps) {
    return (
        <Paper
            p="xl"
            withBorder
            ta="center"
            style={{
                backgroundColor: 'var(--surface-subtle)',
                borderColor: 'var(--surface-subtle-border)',
            }}
        >
            <Stack align="center" gap="md" py="md">
                <ThemeIcon size={64}>
                    <Check size={32} strokeWidth={3} />
                </ThemeIcon>
                <Title order={2} size="h3" c="brand">
                    Inschrijving Ontvangen!
                </Title>
                <Text c="dimmed">
                    {currentUser
                        ? 'Bedankt voor je inschrijving. Je status wordt nu bijgewerkt...'
                        : `Bedankt voor je inschrijving! Check je mail (${email || 'jouw e-mailadres'}) voor de bevestiging.`}
                </Text>
            </Stack>
        </Paper>
    );
}
