'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Card, Group, InputWrapper, Stack, Text, Textarea, TextInput, ThemeIcon, Title } from '@mantine/core';
import { submitIntroParentSignup } from '@/server/actions/public/intro.actions';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { Heart, Lock } from 'lucide-react';
import { introParentSignupFormSchema, type IntroParentSignupForm } from '@salvemundi/validations/schema/intro.zod';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface IntroParentIslandProps {
    initialPhone: string;
    isOpen?: boolean;
}

export const IntroParentIsland = ({ initialPhone, isOpen = true }: IntroParentIslandProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hasValidPhone = !!(
        initialPhone &&
        /^\+[1-9][0-9\s\-()]+$/.test(formatPhoneNumber(initialPhone)) &&
        formatPhoneNumber(initialPhone).length >= 8 &&
        formatPhoneNumber(initialPhone).length <= 16
    );

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<IntroParentSignupForm>({
        resolver: zodResolver(introParentSignupFormSchema),
        defaultValues: {
            telefoonnummer: formatPhoneNumber(initialPhone),
            motivation: ''
        }
    });

    const onSubmit = async (data: IntroParentSignupForm) => {
        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitIntroParentSignup(data);

            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || 'Er is een fout opgetreden.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het versturen van je aanmelding.';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) {
        return (
            <Card flex={1} padding="xl" shadow="xl" withBorder ta="center" mih={300}>
                <Stack align="center" justify="center" gap="md" h="100%">
                    <ThemeIcon size="xl">
                        <Lock size={36} />
                    </ThemeIcon>
                    <Title order={3} size="h2">
                        Inschrijvingen Gesloten
                    </Title>
                    <Text c="dimmed" maw={360}>
                        De inschrijvingen voor Intro Ouders zijn momenteel gesloten.
                    </Text>
                </Stack>
            </Card>
        );
    }

    if (submitted) {
        return (
            <Card flex={1} padding="xl" shadow="lg" withBorder ta="center">
                <Stack gap="sm" align="center">
                    <Title order={3} size="h3">
                        Je hebt je aangemeld als Intro Ouder
                    </Title>
                    <Text c="dimmed">
                        Bedankt! Je inschrijving is ontvangen. Als je iets wilt aanpassen, neem contact op met de intro commissie.
                    </Text>
                </Stack>
            </Card>
        );
    }

    return (
        <Card flex={1} padding="xl" shadow="xl" withBorder>
            <Stack gap="lg" h="100%">
                <Stack gap="xs">
                    <Group gap="sm" align="center">
                        <ThemeIcon size="lg">
                            <Heart size={20} />
                        </ThemeIcon>
                        <Title order={2} size="h2" c="brand">
                            Word Intro Ouder!
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Begeleid de nieuwe lichting studenten tijdens de introweek.
                    </Text>
                </Stack>

                <Box
                    component="form"
                    onSubmit={(e) => { void handleSubmit(onSubmit)(e); }}
                    style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 'var(--mantine-spacing-md)' }}
                    autoComplete="off"
                >
                    <Stack gap="md" style={{ flex: 1 }}>
                        {!hasValidPhone ? (
                            <InputWrapper
                                id="field-telefoonnummer"
                                label="Telefoonnummer"
                                required
                                error={errors.telefoonnummer?.message}
                            >
                                <Controller
                                    name="telefoonnummer"
                                    control={control}
                                    render={({ field }) => (
                                        <PhoneInput
                                            {...field}
                                            id="field-telefoonnummer"
                                            required
                                            autoComplete="one-time-code"
                                            error={!!errors.telefoonnummer}
                                        />
                                    )}
                                />
                            </InputWrapper>
                        ) : (
                            <TextInput display="none" {...register('telefoonnummer')} />
                        )}

                        <Textarea
                            id="field-motivation"
                            label="Motivatie"
                            required
                            minRows={5}
                            autosize
                            placeholder="Vertel ons waarom jij een goede Intro Ouder zou zijn..."
                            autoComplete="off"
                            error={errors.motivation?.message}
                            {...register('motivation')}
                        />
                    </Stack>

                    {error && (
                        <Alert color="error">
                            {error}
                        </Alert>
                    )}

                    <Button type="submit" fullWidth size="md" loading={isSubmitting} mt="xs">
                        {isSubmitting ? 'Bezig...' : 'Meld je aan als Intro Ouder'}
                    </Button>
                </Box>
            </Stack>
        </Card>
    );
};
