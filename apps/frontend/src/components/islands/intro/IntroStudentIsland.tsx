'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Box, Button, Card, Group, InputWrapper, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { submitIntroSignup } from '@/server/actions/public/intro.actions';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { CheckCircle2, Send, Lock } from 'lucide-react';
import { introSignupFormSchema, type IntroSignupForm } from '@salvemundi/validations/schema/intro.zod';

interface IntroStudentIslandProps {
    isOpen?: boolean;
}

const parseNlDate = (input: string): string | null => {
    const trimmed = input.trim();
    const nlMatch = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (nlMatch) {
        return `${nlMatch[3]}-${nlMatch[2].padStart(2, '0')}-${nlMatch[1].padStart(2, '0')}`;
    }
    const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return isoMatch ? trimmed : null;
};

export const IntroStudentIsland = ({ isOpen = true }: IntroStudentIslandProps) => {
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors }
    } = useForm<IntroSignupForm>({
        resolver: zodResolver(introSignupFormSchema),
        defaultValues: {
            voornaam: '',
            tussenvoegsel: '',
            achternaam: '',
            geboortedatum: '',
            email: '',
            telefoonnummer: '',
            favorieteGif: '',
            website: ''
        }
    });

    const onSubmit = async (data: IntroSignupForm) => {
        if (data.website) {
            setSubmitted(true);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const result = await submitIntroSignup(data);
            if (result.success) {
                setSubmitted(true);
            } else {
                setError(result.error || 'Er is een fout opgetreden.');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Er is een fout opgetreden bij het versturen van je inschrijving.';
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
                        De inschrijvingen voor de introductie zijn momenteel gesloten.
                    </Text>
                </Stack>
            </Card>
        );
    }

    if (submitted) {
        return (
            <Card flex={1} padding="xl" shadow="lg" withBorder ta="center">
                <Stack align="center" gap="md">
                    <ThemeIcon size="xl">
                        <CheckCircle2 size={36} />
                    </ThemeIcon>
                    <Title order={2} size="h2">
                        Bedankt!
                    </Title>
                    <Text c="dimmed">
                        We hebben je inschrijving ontvangen.
                    </Text>
                </Stack>
            </Card>
        );
    }

    return (
        <Card flex={1} padding="xl" shadow="xl" withBorder>
            <Stack gap="lg">
                <Stack gap="xs">
                    <Group gap="sm" align="center">
                        <ThemeIcon size="lg">
                            <Send size={20} />
                        </ThemeIcon>
                        <Title order={2} size="h2" c="brand">
                            Schrijf je nu in!
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Meld je aan voor de gezelligste week van het jaar!
                    </Text>
                </Stack>

                <Box component="form" onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} autoComplete="off">
                    <Stack gap="md">
                        <TextInput {...register('website')} type="text" display="none" tabIndex={-1} autoComplete="off" />

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <TextInput
                                id="field-voornaam"
                                label="Voornaam"
                                required
                                autoComplete="off"
                                error={errors.voornaam?.message}
                                {...register('voornaam')}
                            />
                            <TextInput
                                id="field-tussenvoegsel"
                                label="Tussenvoegsel"
                                autoComplete="off"
                                error={errors.tussenvoegsel?.message}
                                {...register('tussenvoegsel')}
                            />
                        </SimpleGrid>

                        <TextInput
                            id="field-achternaam"
                            label="Achternaam"
                            required
                            autoComplete="off"
                            error={errors.achternaam?.message}
                            {...register('achternaam')}
                        />

                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                            <Controller
                                name="geboortedatum"
                                control={control}
                                render={({ field }) => (
                                    <DateInput
                                        id="field-geboortedatum"
                                        label="Geboortedatum"
                                        required
                                        value={field.value || null}
                                        onChange={(val) => field.onChange(val ?? '')}
                                        valueFormat="DD-MM-YYYY"
                                        dateParser={parseNlDate}
                                        placeholder="dd-mm-jjjj"
                                        autoComplete="off"
                                        error={errors.geboortedatum?.message}
                                    />
                                )}
                            />

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
                        </SimpleGrid>

                        <TextInput
                            id="field-email"
                            type="email"
                            label="E-mailadres"
                            required
                            autoComplete="one-time-code"
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <TextInput
                            id="field-favorieteGif"
                            type="url"
                            label="Favoriete GIF URL (optioneel)"
                            placeholder="https://..."
                            error={errors.favorieteGif?.message}
                            {...register('favorieteGif')}
                        />

                        {error && (
                            <Alert color="error">
                                {error}
                            </Alert>
                        )}

                        <Button type="submit" fullWidth size="md" loading={isSubmitting} mt="xs">
                            {isSubmitting ? 'Bezig...' : 'Verstuur'}
                        </Button>
                    </Stack>
                </Box>
            </Stack>
        </Card>
    );
};
