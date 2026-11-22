'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import Link from 'next/link';
import {
    Save,
    Trash,
    ArrowLeft,
    CheckCircle2,
    Shield,
    User,
    CreditCard,
    ChevronLeft,
} from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Container,
    Divider,
    Grid,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import {
    updateTripSignup,
    deleteTripSignup,
    updateSignupActivities,
} from '@/server/actions/beheer/reis/beheer-reis-signups.actions';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';
import ReisSignupForm from './ReisSignupForm';
import ReisSignupActivities from './ReisSignupActivities';

const calculateAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
    }
    return age;
};

const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);

interface ReisParticipantDetailIslandProps {
    initialSignup: TripSignup;
    trips: Trip[];
    allActivities: TripActivity[];
    initialSelectedActivities: number[];
}

interface ActionState {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<
        string,
        FormDataEntryValue | FormDataEntryValue[] | boolean | number | null | undefined
    >;
}

export default function ReisParticipantDetailIsland({
    initialSignup,
    trips,
    allActivities,
    initialSelectedActivities,
}: ReisParticipantDetailIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [state, formAction, isSaving] = useActionState<ActionState | null, FormData>(
        updateTripSignup,
        null
    );
    const [selectedActivities, setSelectedActivities] = useState<number[]>(
        initialSelectedActivities
    );
    const [isUpdatingActivities, setIsUpdatingActivities] = useState(false);

    const toggleActivity = (id: number) => {
        setSelectedActivities((prev) =>
            prev.includes(id) ? prev.filter((aid) => aid !== id) : [...prev, id]
        );
    };

    const handleUpdateActivities = async () => {
        setIsUpdatingActivities(true);
        try {
            const res = await updateSignupActivities(initialSignup.id, selectedActivities);
            if (!res.success) {
                showToast(res.error || 'Fout bij het bijwerken van activiteiten', 'error');
            } else {
                showToast('Activiteiten succesvol bijgewerkt', 'success');
            }
        } catch (error) {
            safeConsoleError('[ReisParticipantDetailIsland.tsx][ReisParticipantDetailIsland] ', error);
            showToast('Geen verbinding met de server', 'error');
        } finally {
            setIsUpdatingActivities(false);
        }
    };

    const handleDelete = async () => {
        if (
            !confirm(
                'Weet je zeker dat je deze deelnemer wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
            )
        )
            return;

        startTransition(async () => {
            try {
                const res = await deleteTripSignup(initialSignup.id);
                if (res.success) {
                    router.push('/beheer/reis');
                } else {
                    showToast(res.error || 'Verwijderen mislukt', 'error');
                }
            } catch (error) {
                safeConsoleError(
                    '[ReisParticipantDetailIsland.tsx][ReisParticipantDetailIsland] ',
                    error
                );
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

    const age = initialSignup.date_of_birth ? calculateAge(initialSignup.date_of_birth) : '?';

    const paymentStatus = initialSignup.full_payment_paid
        ? 'Voldaan'
        : initialSignup.deposit_paid
          ? 'Aanbetaling'
          : 'Niet betaald';

    const adminStats = [
        {
            label: 'Status',
            value: initialSignup.status === 'confirmed' ? 'Bevestigd' : 'Afwachtend',
            icon: CheckCircle2,
        },
        { label: 'Leeftijd', value: `${age} jaar`, icon: User },
        { label: 'Betaling', value: paymentStatus, icon: CreditCard },
        { label: 'Rol', value: initialSignup.role === 'crew' ? 'Crew' : 'Reiziger', icon: Shield },
    ];

    useEffect(() => {
        if (state?.success && !isSaving) {
            showToast('Deelnemer details succesvol bijgewerkt', 'success');
        } else if (state?.error && !isSaving) {
            showToast(state.error, 'error');
        }
    }, [state, isSaving, showToast]);

    const selectedTrip = trips.find((t) => t.id === initialSignup.trip_id);

    return (
        <>
            <Paper shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Group gap="md">
                            <Button
                                component={Link}
                                href="/beheer/reis"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                            >
                                Terug
                            </Button>
                            <Stack gap={0}>
                                <Title order={1} size="h3" c="brand">
                                    {initialSignup.first_name} {initialSignup.last_name}
                                </Title>
                                <Text size="xs" c="dimmed">
                                    Beheer details voor deze reiziger aan{' '}
                                    {selectedTrip?.name || 'de reis'}
                                </Text>
                            </Stack>
                        </Group>

                        <Button
                            type="button"
                            color="error"
                            loading={isPending}
                            leftSection={<Trash size={16} />}
                            onClick={() => {
                                void handleDelete();
                            }}
                        >
                            Verwijderen
                        </Button>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                        {adminStats.map((stat) => (
                            <Card key={stat.label} p="md" shadow="xs">
                                <Group gap="xs">
                                    <ThemeIcon size="sm">
                                        <stat.icon size={14} />
                                    </ThemeIcon>
                                    <Text size="xs" fw={600} c="dimmed">
                                        {stat.label}
                                    </Text>
                                </Group>
                                <Text size="lg" fw={700} mt={4}>
                                    {stat.value}
                                </Text>
                            </Card>
                        ))}
                    </SimpleGrid>

                    <Box component="form" action={formAction}>
                        <TextInput display="none" name="id" value={String(initialSignup.id)} readOnly />
                        <Grid gap="xl">
                            <Grid.Col span={{ base: 12, lg: 8 }}>
                                <ReisSignupForm
                                    key={`${initialSignup.id}-${initialSignup.role}`}
                                    signup={initialSignup}
                                    initialData={state?.initialData}
                                    isBusTrip={!!selectedTrip?.is_bus_trip}
                                />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, lg: 4 }}>
                                <Stack gap="lg">
                                    <ReisSignupActivities
                                        allActivities={allActivities}
                                        selectedActivities={selectedActivities}
                                        onToggleActivity={toggleActivity}
                                        onUpdate={() => {
                                            void handleUpdateActivities();
                                        }}
                                        isUpdating={isUpdatingActivities}
                                    />

                                    <Card p="lg" shadow="sm">
                                        <Stack gap="md">
                                            <Group justify="space-between">
                                                <Text size="sm" fw={600} c="dimmed">
                                                    Aangemeld op
                                                </Text>
                                                <Text size="sm" fw={600}>
                                                    {initialSignup.created_at
                                                        ? formatDateTime(
                                                              new Date(initialSignup.created_at)
                                                          )
                                                        : '-'}
                                                </Text>
                                            </Group>
                                            <Divider />
                                            <Group justify="space-between">
                                                <Text size="sm" fw={600} c="dimmed">
                                                    Deelnemer ID
                                                </Text>
                                                <Text size="sm" fw={600}>
                                                    #{initialSignup.id}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </Card>

                                    <Stack gap="sm">
                                        <Button
                                            type="submit"
                                            size="lg"
                                            fullWidth
                                            loading={isSaving}
                                            leftSection={<Save size={20} />}
                                        >
                                            Gegevens Opslaan
                                        </Button>

                                        <Group gap="sm" wrap="nowrap">
                                            <Button
                                                type="button"
                                                flex={1}
                                                size="md"
                                                onClick={() => router.push('/beheer/reis')}
                                                leftSection={<ArrowLeft size={16} />}
                                            >
                                                Annuleren
                                            </Button>
                                            <ActionIcon
                                                type="button"
                                                color="error"
                                                size="xl"
                                                loading={isPending}
                                                onClick={() => {
                                                    void handleDelete();
                                                }}
                                                aria-label="Deelnemer verwijderen"
                                            >
                                                <Trash size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </Stack>
                                </Stack>
                            </Grid.Col>
                        </Grid>
                    </Box>
                </Stack>
            </Container>
        </>
    );
}
