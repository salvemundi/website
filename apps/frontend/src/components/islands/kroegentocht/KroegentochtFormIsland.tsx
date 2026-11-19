'use client';

import React, { useTransition } from 'react';
import { Controller, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Paper,
    ScrollArea,
    Select,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { initiateKroegentochtPayment } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';
import {
    type PubCrawlEvent,
    pubCrawlSignupFormSchema,
    PUB_CRAWL_ASSOCIATIONS
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { Plus, Minus, Mail, Building, Ticket } from 'lucide-react';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface KroegentochtFormIslandProps {
    event?: PubCrawlEvent;
    initialUser?: { email?: string; association?: string } | null;
}

const formSchema = pubCrawlSignupFormSchema;

type PubCrawlSignupFormValues = z.infer<typeof formSchema>;

export default function KroegentochtFormIsland({
    event = {} as PubCrawlEvent,
    initialUser
}: KroegentochtFormIslandProps) {
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<PubCrawlSignupFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: initialUser?.email || '',
            association: initialUser?.association || '',
            amount_tickets: 1,
            participants: [{
                name: '',
                initial: ''
            }],
            website: '',
            pub_crawl_event_id: event.id
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const amount = watch('amount_tickets');

    const onSubmit = async (data: PubCrawlSignupFormValues) => {
        if (data.website) return;

        startTransition(async () => {
            const participants = data.participants;

            const formData = {
                ...data,
                name: `${participants[0].name} ${participants[0].initial}`.trim(),
                association: data.association || '',
                name_initials: JSON.stringify(participants),
                pub_crawl_event_id: Number(event.id)
            };

            const result = await initiateKroegentochtPayment(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de betaling.', 'error');
            }
        });
    };

    return (
        <Card padding="xl" radius="xl" shadow="xl" withBorder>
            <Stack gap="lg">
                <Stack gap="xs">
                    <Group gap="sm">
                        <ThemeIcon size="lg" radius="md" variant="light" color="brand">
                            <Ticket size={20} />
                        </ThemeIcon>
                        <Title order={2} size="h2" c="brand">
                            Inschrijven
                        </Title>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Vul hieronder je gegevens in en reserveer je plek voor de kroegentocht. Tickets kosten slechts €1,00 per stuk!
                    </Text>
                </Stack>

                <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} autoComplete="off">
                    <Stack gap="md">
                        <TextInput
                            id="field-email"
                            type="email"
                            label="E-mailadres"
                            required
                            placeholder="jouw@email.nl"
                            leftSection={<Mail size={16} />}
                            error={errors.email?.message}
                            {...register('email')}
                        />

                        <Controller
                            name="association"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    id="field-association"
                                    label="Vereniging"
                                    required
                                    placeholder="Selecteer vereniging"
                                    leftSection={<Building size={16} />}
                                    data={PUB_CRAWL_ASSOCIATIONS.map((a: string) => ({ value: a, label: a }))}
                                    value={field.value || null}
                                    onChange={(val) => field.onChange(val ?? '')}
                                    error={errors.association?.message}
                                />
                            )}
                        />

                        <Divider my="xs" />

                        <Group justify="space-between" align="center">
                            <Text size="sm" fw={700}>
                                Aantal Personen
                            </Text>
                            <Paper p={4} radius="md" withBorder>
                                <Group gap="sm" wrap="nowrap">
                                    <ActionIcon
                                        type="button"
                                        variant="subtle"
                                        size="md"
                                        disabled={amount <= 1}
                                        aria-label="Verminder aantal"
                                        onClick={() => {
                                            if (amount > 1) {
                                                setValue('amount_tickets', amount - 1);
                                                remove(fields.length - 1);
                                            }
                                        }}
                                    >
                                        <Minus size={16} />
                                    </ActionIcon>
                                    <Text size="lg" fw={900} w={32} ta="center">
                                        {amount}
                                    </Text>
                                    <ActionIcon
                                        type="button"
                                        variant="subtle"
                                        size="md"
                                        disabled={amount >= 10}
                                        aria-label="Verhoog aantal"
                                        onClick={() => {
                                            if (amount < 10) {
                                                setValue('amount_tickets', amount + 1);
                                                append({ name: '', initial: '' });
                                            }
                                        }}
                                    >
                                        <Plus size={16} />
                                    </ActionIcon>
                                </Group>
                            </Paper>
                        </Group>

                        <ScrollArea.Autosize mah={400}>
                            <Stack gap="sm">
                                {fields.map((field, index) => (
                                    <Paper key={field.id} p="md" radius="md" withBorder>
                                        <Stack gap="xs">
                                            <Group gap="xs">
                                                <Badge size="sm" circle color="brand">
                                                    {index + 1}
                                                </Badge>
                                                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                                    Deelnemer {index + 1}
                                                </Text>
                                            </Group>
                                            <Group gap="sm" align="flex-start" wrap="nowrap">
                                                <Controller
                                                    name={`participants.${index}.name`}
                                                    control={control}
                                                    render={({ field: itemField, fieldState }) => (
                                                        <TextInput
                                                            id={`field-participants-${index}-name`}
                                                            label="Voornaam + tussenvoegsel"
                                                            placeholder="Bijv. Jan van"
                                                            required
                                                            style={{ flex: 1 }}
                                                            value={itemField.value}
                                                            onChange={itemField.onChange}
                                                            onBlur={itemField.onBlur}
                                                            error={fieldState.error?.message}
                                                        />
                                                    )}
                                                />
                                                <Controller
                                                    name={`participants.${index}.initial`}
                                                    control={control}
                                                    render={({ field: itemField, fieldState }) => (
                                                        <TextInput
                                                            id={`field-participants-${index}-initial`}
                                                            label="1e letter achtern."
                                                            placeholder="Bijv. S"
                                                            maxLength={1}
                                                            required
                                                            w={100}
                                                            styles={{ input: { textAlign: 'center', fontWeight: 700, textTransform: 'uppercase' } }}
                                                            value={itemField.value}
                                                            onChange={(e) => itemField.onChange(e.currentTarget.value.slice(0, 1).toUpperCase())}
                                                            onBlur={itemField.onBlur}
                                                            error={fieldState.error?.message}
                                                        />
                                                    )}
                                                />
                                            </Group>
                                        </Stack>
                                    </Paper>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>

                        <Button type="submit" fullWidth size="lg" loading={isPending} mt="xs">
                            {isPending
                                ? 'Verwerken...'
                                : `Betalen & Inschrijven (€${(amount * 1.00).toFixed(2).replace('.', ',')})`}
                        </Button>

                        <Box
                            aria-hidden="true"
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: 0,
                                height: 0,
                                overflow: 'hidden',
                                opacity: 0,
                                pointerEvents: 'none',
                            }}
                        >
                            <label htmlFor="website">Website</label>
                            <input {...register('website')} id="website" tabIndex={-1} autoComplete="off" style={{ display: 'none' }} suppressHydrationWarning />
                        </Box>
                    </Stack>
                </form>
            </Stack>
        </Card>
    );
}
