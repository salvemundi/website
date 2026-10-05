'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Plus,
    Info
} from 'lucide-react';
import {
    deleteTrip,
    toggleReisVisibility
} from '@/server/actions/beheer/reis/beheer-reis-core.actions';
import BeheerVisibilityToggle from '@/components/ui/beheer/BeheerVisibilityToggle';
import type { Trip } from '@salvemundi/validations';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { safeConsoleError } from '@/server/utils/logger';
import ReisCard from '@/components/admin/reis/ReisCard';
import ReisForm from '@/components/admin/reis/ReisForm';

interface ReisSettingsIslandProps {
    initialTrips: Trip[];
    initialSettings: { show: boolean };
}

export default function ReisSettingsIsland({ initialTrips, initialSettings }: ReisSettingsIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();
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
                    showToast(`Reis is nu ${result.show ? 'zichtbaar' : 'verborgen'}`, 'success');
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
        if (!confirm('Weet je zeker dat je deze reis wilt verwijderen? Dit verwijdert ook alle aanmeldingen!')) return;

        setIsDeleting(id);
        try {
            const res = await deleteTrip(id);
            if (res.success) {
                setTrips(prev => prev.filter(t => t.id !== id));
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
            <BeheerToolbar
                title="Reis Instellingen"
                backHref="/beheer/reis"
                actions={
                    <div className="flex items-center gap-4">
                        <BeheerVisibilityToggle
                            isVisible={settings.show}
                            onToggle={handleToggleVisibility}
                            isPending={isPending}
                        />
                        <button
                            onClick={handleAdd}
                            className="group beheer-button"
                            type="button">
                            <Plus className="size-4 transition-transform group-hover:rotate-90" />
                            <span>Nieuwe Reis</span>
                        </button>
                    </div>
                }
            />

            <div className="admin-container-padded">
                {(isAdding || editingTrip) && (
                    <ReisForm
                        editingTrip={editingTrip}
                        isAdding={isAdding}
                        onCancel={handleCancel}
                        onSuccess={handleSuccess}
                    />
                )}

                {!isAdding && !editingTrip && (
                    <div className="mb-20 ticket-grid-layout">
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
                            <div className="col-span-full py-20 text-center">
                                <Info className="ticket-empty-icon" />
                                <p className="font-semibold text-beheer-text-muted italic">Nog geen reizen gepland...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <BeheerToast toast={toast} onClose={hideToast} />
        </>
    );
}