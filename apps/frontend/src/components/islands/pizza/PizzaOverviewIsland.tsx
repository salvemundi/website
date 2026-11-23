'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pizza, Plus, Clock, Users, ChevronRight, BarChart3 } from 'lucide-react';
import {
    Anchor,
    Badge,
    Box,
    Button,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { createPizzaRoundSchema, type CreatePizzaRoundInput, type PizzaRoundSummary } from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import { createPizzaRound } from '@/server/actions/public/pizza.actions';
import { formatEuro, STATUS_LABEL } from './pizza-utils';

interface Props {
    open: PizzaRoundSummary[];
    mine: PizzaRoundSummary[];
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'open':
            return 'success';
        case 'closed':
            return 'accent';
        default:
            return 'brand';
    }
}

function RoundList({ rounds, empty }: { rounds: PizzaRoundSummary[]; empty: string }) {
    if (rounds.length === 0) {
        return (
            <Paper p="xl" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                <Text size="sm" fw={700} c="dimmed">
                    {empty}
                </Text>
            </Paper>
        );
    }
    return (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">
            {rounds.map((r) => (
                <Anchor key={r.id} component={Link} href={`/pizza/${r.id}`} underline="never">
                    <Paper p="md" withBorder h="100%">
                        <Group justify="space-between" wrap="nowrap" gap="md">
                            <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                                <Group gap="xs" wrap="wrap">
                                    <Text size="sm" fw={900} truncate>
                                        {r.title}
                                    </Text>
                                    <Badge size="xs" color={getStatusColor(r.status)}>
                                        {STATUS_LABEL[r.status]}
                                    </Badge>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    Door {r.creatorName}
                                </Text>
                                <Group gap="md" wrap="wrap">
                                    <Group gap={4}>
                                        <Text span c="brand" lh={1}>
                                            <Clock size={14} />
                                        </Text>
                                        <Text size="xs" fw={700}>
                                            {formatDate(r.closesAt, 'd MMMM yyyy HH:mm')}
                                        </Text>
                                    </Group>
                                    <Group gap={4}>
                                        <Text span c="brand" lh={1}>
                                            <Users size={14} />
                                        </Text>
                                        <Text size="xs" fw={700}>
                                            {r.orderCount} {r.orderCount === 1 ? 'bestelling' : 'bestellingen'} · {formatEuro(r.totalAmount)}
                                        </Text>
                                    </Group>
                                </Group>
                            </Stack>
                            <Text span c="brand" lh={1}>
                                <ChevronRight size={16} />
                            </Text>
                        </Group>
                    </Paper>
                </Anchor>
            ))}
        </SimpleGrid>
    );
}

export function PizzaOverviewIsland({ open, mine }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { showToast } = useAdminToast();
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.input<typeof createPizzaRoundSchema>, unknown, CreatePizzaRoundInput>({
        resolver: zodResolver(createPizzaRoundSchema),
        defaultValues: { title: '', note: '', paymentLink: '' },
    });

    const onSubmit = (data: CreatePizzaRoundInput) => {
        startTransition(async () => {
            const result = await createPizzaRound(data);
            if (result.success) {
                reset();
                showToast('Pizza-ronde aangemaakt', 'success');
                router.push(`/pizza/${result.id}`);
            } else {
                showToast(result.error || 'Er ging iets mis bij het aanmaken van de ronde', 'error');
            }
        });
    };

    return (
        <Stack gap="xl">
            <Box>
                <Button
                    component={Link}
                    href="/pizza/statistieken"
                    leftSection={<BarChart3 size={16} />}
                >
                    Mijn statistieken
                </Button>
            </Box>

            <Tile title="Open rondes" icon={<Pizza size={22} />}>
                <RoundList rounds={open} empty="Er zijn nu geen open pizza-rondes." />
            </Tile>

            <Tile title="Mijn rondes" icon={<Users size={22} />}>
                <RoundList rounds={mine} empty="Je hebt nog geen rondes gestart of meebesteld." />
            </Tile>

            <Tile title="Nieuwe ronde" icon={<Plus size={22} />}>
                <Box component="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                        <TextInput
                            label="Titel"
                            required
                            placeholder="Bijv. Pizza na de borrel"
                            maxLength={100}
                            error={errors.title?.message}
                            {...register('title')}
                        />

                        <Controller
                            name="closes_at"
                            control={control}
                            render={({ field }) => (
                                <DateTimePicker
                                    label="Sluitingstijd"
                                    required
                                    valueFormat="DD-MM-YYYY HH:mm"
                                    placeholder="Kies datum en tijd"
                                    value={typeof field.value === 'string' || field.value instanceof Date ? field.value : null}
                                    onChange={(val) => field.onChange(val ?? '')}
                                    error={errors.closes_at?.message}
                                />
                            )}
                        />

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Textarea
                                label="Opmerking"
                                rows={3}
                                maxLength={500}
                                placeholder="Bijv. bestellen bij Domino's, ophalen om 19:00"
                                error={errors.note?.message}
                                {...register('note')}
                            />
                        </Box>

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <TextInput
                                type="url"
                                label="Betaallink (optioneel, https)"
                                placeholder="https://..."
                                maxLength={500}
                                error={errors.paymentLink?.message}
                                {...register('paymentLink')}
                            />
                        </Box>

                        <Box style={{ gridColumn: '1 / -1' }}>
                            <Button
                                type="submit"
                                loading={isPending}
                                leftSection={<Plus size={16} />}
                                w={{ base: '100%', sm: 'auto' }}
                            >
                                {isPending ? 'Aanmaken...' : 'Ronde starten'}
                            </Button>
                        </Box>
                    </SimpleGrid>
                </Box>
            </Tile>
        </Stack>
    );
}
