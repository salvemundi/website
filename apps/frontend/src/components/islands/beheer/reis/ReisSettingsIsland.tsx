'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Info, ChevronLeft } from 'lucide-react';
import {
    Button,
    Center,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import {
    deleteTrip,
    toggleReisVisibility,
} from '@/server/actions/beheer/reis/beheer-reis-core.actions';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import type { Trip } from '@salvemundi/validations';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';
import ReisCard from '@/components/admin/reis/ReisCard';
import ReisForm from '@/components/admin/reis/ReisForm';

interface ReisSettingsIslandProps {
    initialTrips: Trip[];
    initialSettings: { show: boolean };
}

export default function ReisSettingsIsland({
    initialTrips,
    initialSettings,
}: ReisSettingsIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { showToast } = useAdminToast();
    const [trips, setTrips] = useState<Trip[]>(initialTrips);
    const [settings, setSettings] = useState(initialSettings);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    useEffect(() => {
        setTrips(initialTrips);
        setSettings(initialSettings);
    }, [initialTrips, initialSettings]);

    const handleCancel = () => {
        setEditingTrip(null);
        setIsAdding(false);
    };

    const handleSuccess = (message: string) => {
        showToast(message, 'success');
        setEditingTrip(null);
        setIsAdding(false);
        router.refresh();
    };

    const handleEdit = (trip: Trip) => {
        setEditingTrip(trip);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setEditingTrip(null);
        setIsAdding(true);
    };

    const handleToggleVisibility = () => {
        startTransition(async () => {
            try {
                const result = await toggleReisVisibility();
                if (result.success) {
                    setSettings({ show: result.show ?? false });
                    showToast(
                        `Reis is nu ${result.show ? 'zichtbaar' : 'verborgen'}`,
                        'success'
                    );
                    router.refresh();
                } else {
                    showToast(result.error || 'Fout bij bijwerken zichtbaarheid', 'error');
                }
            } catch (error) {
                safeConsoleError('[ReisSettingsIsland.tsx][ReisSettingsIsland] ', error);
                showToast('Er is een onverwachte fout opgetreden', 'error');
            }
        });
    };

    const handleDelete = async (id: number) => {
        if (
            !confirm(
                'Weet je zeker dat je deze reis wilt verwijderen? Dit verwijdert ook alle aanmeldingen!'
            )
        )
            return;

        setIsDeleting(id);
        try {
            const res = await deleteTrip(id);
            if (res.success) {
                setTrips((prev) => prev.filter((t) => t.id !== id));
                showToast('Reis succesvol verwijderd', 'success');
                router.refresh();
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        } catch (error) {
            safeConsoleError('[ReisSettingsIsland.tsx][ReisSettingsIsland] ', error);
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsDeleting(null);
        }
    };

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
                            <Title order={1} size="h3" c="brand">
                                Reis Instellingen
                            </Title>
                        </Group>

                        <Group gap="md" wrap="wrap">
                            <BeheerVisibilityToggle
                                isVisible={settings.show}
                                onToggle={handleToggleVisibility}
                                isPending={isPending}
                            />
                            <Button
                                type="button"
                                size="sm"
                                onClick={handleAdd}
                                leftSection={<Plus size={16} />}
                            >
                                Nieuwe Reis
                            </Button>
                        </Group>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="xl">
                {(isAdding || editingTrip) && (
                    <ReisForm
                        editingTrip={editingTrip}
                        isAdding={isAdding}
                        onCancel={handleCancel}
                        onSuccess={handleSuccess}
                    />
                )}

                {!isAdding && !editingTrip && (
                    <SimpleGrid cols={{ base: 1, md: 2, lg: 3 }} spacing="lg" mb={64}>
                        {trips.map((trip) => (
                            <ReisCard
                                key={trip.id}
                                trip={trip}
                                onEdit={() => handleEdit(trip)}
                                onDelete={() => {
                                    void handleDelete(trip.id);
                                }}
                                isDeleting={isDeleting === trip.id}
                            />
                        ))}
                        {trips.length === 0 && (
                            <Center py={80} style={{ gridColumn: '1 / -1' }}>
                                <Stack align="center" gap="sm">
                                    <Text span c="dimmed" lh={1}>
                                        <Info size={40} />
                                    </Text>
                                    <Text fw={600} c="dimmed" fs="italic">
                                        Nog geen reizen gepland...
                                    </Text>
                                </Stack>
                            </Center>
                        )}
                    </SimpleGrid>
                )}
            </Container>
        </>
    );
}
