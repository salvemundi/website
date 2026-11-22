'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, Send, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Group,
    InputWrapper,
    Paper,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { eventSignupFormSchema, phoneNumberSchema, type EventSignupForm } from '@salvemundi/validations';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { type EnrichedUser } from '@/types/auth';

interface SignupFormContentProps {
    onSubmit: (data: EventSignupForm) => void;
    isPending: boolean;
    price: number;
    initialData: {
        event_id: number;
        name: string;
        email: string;
        phoneNumber: string;
    };
    serverError: string | null;
    isLoggedIn?: boolean;
    user?: EnrichedUser | null;
}

export default function SignupFormContent({
    onSubmit,
    isPending,
    price,
    initialData,
    serverError,
    isLoggedIn = false,
    user
}: SignupFormContentProps) {
    const isPaid = price > 0;

    const schema = isLoggedIn
        ? eventSignupFormSchema
        : eventSignupFormSchema.extend({
            phoneNumber: phoneNumberSchema
        });

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<EventSignupForm>({
        resolver: zodResolver(schema),
        defaultValues: {
            ...initialData,
            website: ''
        }
    });

    const displayName = user?.first_name
        ? `${user.first_name} ${user.last_name || ''}`.trim()
        : (user?.name || initialData.name || 'Lid');

    const initialFirst = user?.first_name ? user.first_name[0] : (user?.name ? user.name[0] : 'U');
    const initialLast = user?.last_name ? user.last_name[0] : '';
    const initials = `${initialFirst}${initialLast}`.toUpperCase();

    return (
        <Card padding="xl" shadow="xl" withBorder>
            <Stack gap="lg">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Group gap="sm">
                        <ThemeIcon size="lg">
                            <Users size={20} />
                        </ThemeIcon>
                        <Title order={2} size="h2" c="brand">
                            Aanmelden
                        </Title>
                    </Group>
                    {price > 0 && (
                        <Text size="1.75rem" fw={900} c="brand">
                            €{price.toFixed(2).replace('.', ',')}
                        </Text>
                    )}
                </Group>

                <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} autoComplete="off">
                    <Stack gap="lg">
                        {isLoggedIn ? (
                            <>
                                <Paper p="md" withBorder>
                                    <Group gap="md" wrap="nowrap">
                                        <ThemeIcon size={48}>
                                            <Text fw={900} size="md">
                                                {initials}
                                            </Text>
                                        </ThemeIcon>
                                        <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                                            <Group gap="xs" wrap="wrap">
                                                <Text size="sm" fw={700} truncate>
                                                    {displayName}
                                                </Text>
                                                <Badge
                                                    size="xs"
                                                    leftSection={<CheckCircle2 size={12} />}
                                                >
                                                    Ingelogd
                                                </Badge>
                                            </Group>
                                            <Text size="xs" c="dimmed" truncate>
                                                {user?.email || initialData.email}
                                            </Text>
                                            {initialData.phoneNumber && (
                                                <Text size="xs" c="dimmed" ff="monospace">
                                                    {initialData.phoneNumber}
                                                </Text>
                                            )}
                                        </Stack>
                                    </Group>
                                </Paper>

                                <input {...register('name')} type="hidden" />
                                <input {...register('email')} type="hidden" />
                                <input {...register('phoneNumber')} type="hidden" />
                            </>
                        ) : (
                            <Stack gap="md">
                                <TextInput
                                    id="field-name"
                                    label="Naam"
                                    required
                                    placeholder="Naam Achternaam"
                                    size="md"
                                    error={errors.name?.message}
                                    {...register('name')}
                                />

                                <TextInput
                                    id="field-email"
                                    type="email"
                                    label="Email"
                                    required
                                    placeholder="voorbeeld@mail.com"
                                    size="md"
                                    error={errors.email?.message}
                                    {...register('email')}
                                />

                                <InputWrapper
                                    id="field-phoneNumber"
                                    label="Telefoonnummer"
                                    required
                                    error={errors.phoneNumber?.message}
                                >
                                    <Controller
                                        name="phoneNumber"
                                        control={control}
                                        render={({ field }) => (
                                            <PhoneInput
                                                {...field}
                                                id="field-phoneNumber"
                                                autoComplete="tel"
                                                error={!!errors.phoneNumber}
                                            />
                                        )}
                                    />
                                </InputWrapper>
                            </Stack>
                        )}

                        {serverError && (
                            <Alert color="error" icon={<AlertCircle size={18} />}>
                                {serverError}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            size="lg"
                            fullWidth
                            loading={isPending}
                            leftSection={isPaid ? <CreditCard size={20} /> : <Send size={20} />}
                        >
                            {isPending
                                ? 'VERWERKEN...'
                                : isPaid
                                    ? `Naar betaling (€${price.toFixed(2).replace('.', ',')})`
                                    : 'Aanmelden'}
                        </Button>

                        <Box style={{ display: 'none' }}>
                            <input {...register('website')} type="text" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
                        </Box>
                    </Stack>
                </form>
            </Stack>
        </Card>
    );
}
