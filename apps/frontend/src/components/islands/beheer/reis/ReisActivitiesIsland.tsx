'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Layers, Plus } from 'lucide-react';
import {
    Button,
    Container,
    Group,
    Paper,
    Select,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    deleteTripActivity,
    createTripActivity,
    updateTripActivity,
} from '@/server/actions/beheer/reis/beheer-reis-activities.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import ReisActivityCard from './ReisActivityCard';
import ReisActivityForm from './ReisActivityForm';
import ReisActivitySignupsModal, { type Signup } from './ReisActivitySignupsModal';
import { type Trip, type TripActivity } from '@salvemundi/validations';
import { type ActivityOption } from '@/lib/reis';

interface ActivityActionResponse {
    success: boolean;
    error?: string;
    initialData?: Partial<TripActivity>;
}

interface Props {
    initialTrips?: Trip[];
    initialActivities?: TripActivity[];
    initialSelectedTripId?: number;
    initialSignupsByActivity?: Record<number, Signup[]>;
    tripName?: string;
}

export default function ReisActivitiesIsland({
    initialTrips = [],
    initialActivities = [],
    initialSelectedTripId = 0,
    initialSignupsByActivity = {},
    tripName = 'Onbekende reis',
}: Props) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [selectedTripId, setSelectedTripId] = useState<number>(initialSelectedTripId);
    const [activities, setActivities] = useState<TripActivity[]>(initialActivities);
    const [signupsByActivity] = useState<Map<number, Signup[]>>(
        () =>
            new Map(
                Object.entries(initialSignupsByActivity).map(([key, value]) => [Number(key), value])
            )
    );

    const [, startTransition] = useTransition();
    const [editingActivity, setEditingActivity] = useState<Partial<TripActivity> | null>(null);
    const [viewingSignupsId, setViewingSignupsId] = useState<number | null>(null);

    useEffect(() => {
        setActivities(initialActivities);
        setSelectedTripId(initialSelectedTripId);
    }, [initialActivities, initialSelectedTripId]);

    const handleTripChange = (id: number) => {
        router.push(`/beheer/reis/activiteiten?tripId=${id}`);
    };

    const handleSave = async (formData: FormData, options: ActivityOption[]) => {
        formData.set('options', JSON.stringify(options));

        let res: ActivityActionResponse;
        if (editingActivity?.id) {
            formData.set('id', editingActivity.id.toString());
            res = (await updateTripActivity(formData)) as ActivityActionResponse;
        } else {
            formData.set('trip_id', selectedTripId.toString());
            res = (await createTripActivity(formData)) as ActivityActionResponse;
        }

        if (res.success) {
            showToast(
                editingActivity?.id ? 'Activiteit bijgewerkt' : 'Activiteit aangemaakt',
                'success'
            );
            setEditingActivity(null);
            router.refresh();
        } else {
            showToast(res.error || 'Fout bij opslaan', 'error');
            if (res.initialData) {
                setEditingActivity(res.initialData);
            }
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze activiteit wilt verwijderen?')) return;

        startTransition(async () => {
            const res = await deleteTripActivity(id);
            if (res.success) {
                setActivities((prev) => prev.filter((a) => a.id !== id));
                showToast('Activiteit verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        });
    };

    return (
        <>
            {!editingActivity && (
                <Paper shadow="xs" py="md">
                    <Container size="xl" py={0}>
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
                                    Reis Activiteiten — {tripName}
                                </Title>
                                <Text size="xs" c="dimmed">
                                    Beheer activiteiten en inschrijvingen per activiteit
                                </Text>
                            </Stack>
                        </Group>
                    </Container>
                </Paper>
            )}

            <Container size="xl" py="lg">
                <Stack gap="xl">
                    {!editingActivity && (
                        <Group justify="space-between" wrap="wrap" gap="md">
                            <Select
                                size="sm"
                                miw={240}
                                value={String(selectedTripId)}
                                onChange={(val) => {
                                    if (val) handleTripChange(Number(val));
                                }}
                                data={initialTrips.map((trip) => ({
                                    value: String(trip.id),
                                    label: trip.name || 'Onbekende reis',
                                }))}
                                allowDeselect={false}
                            />

                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setEditingActivity({})}
                                leftSection={<Plus size={16} />}
                            >
                                Nieuwe Activiteit
                            </Button>
                        </Group>
                    )}

                    {editingActivity && (
                        <ReisActivityForm
                            activity={editingActivity}
                            onSave={handleSave}
                            onCancel={() => setEditingActivity(null)}
                            pending={false}
                        />
                    )}

                    {activities.length === 0 && !editingActivity ? (
                        <Paper
                            withBorder
                            py={80}
                            style={{ borderStyle: 'dashed' }}
                            ta="center"
                        >
                            <Stack align="center" gap="sm">
                                <Text span c="dimmed" lh={1}>
                                    <Layers size={40} />
                                </Text>
                                <Text size="md" fw={600} c="dimmed">
                                    Nog geen activiteiten voor deze reis
                                </Text>
                            </Stack>
                        </Paper>
                    ) : (
                        !editingActivity && (
                            <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg">
                                {activities.map((activity) => (
                                    <ReisActivityCard
                                        key={activity.id}
                                        activity={activity}
                                        onEdit={setEditingActivity}
                                        onDelete={(id) => {
                                            void handleDelete(id);
                                        }}
                                        onViewSignups={setViewingSignupsId}
                                    />
                                ))}
                            </SimpleGrid>
                        )
                    )}

                    {viewingSignupsId && (
                        <ReisActivitySignupsModal
                            activityName={
                                activities.find((a) => a.id === viewingSignupsId)?.name || ''
                            }
                            options={activities.find((a) => a.id === viewingSignupsId)?.options}
                            signups={signupsByActivity.get(viewingSignupsId) ?? []}
                            loading={false}
                            onClose={() => setViewingSignupsId(null)}
                        />
                    )}
                </Stack>
            </Container>
        </>
    );
}
