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
} from '@/server/actions/admin/reis/admin-reis-core.actions';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import type { Trip } from '@salvemundi/validations/schema/admin-trip.zod';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
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
            <AdminToolbar
                title="Reis Instellingen"
                backHref="/beheer/reis"
                actions={
                    <div className="flex items-center gap-4">
                        <AdminVisibilityToggle
                            isVisible={settings.show}
                            onToggle={handleToggleVisibility}
                            isPending={isPending}
                        />
                        <button
                            onClick={handleAdd}
                            className="group beheer-button flex items-center gap-2 rounded-xl border border-white/10 bg-(--beheer-accent) px-6 py-2.5 text-[10px] font-semibold tracking-widest text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                        >
                            <Plus className="size-4 transition-transform group-hover:rotate-90" />
                            <span>Nieuwe Reis</span>
                        </button>
                    </div>
                }
            />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                {(isAdding || editingTrip) && (
                    <ReisForm
                        editingTrip={editingTrip}
                        isAdding={isAdding}
                        onCancel={handleCancel}
                        onSuccess={handleSuccess}
                    />
                )}

                {!isAdding && !editingTrip && (
                    <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                                <Info className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-20" />
                                <p className="font-semibold text-(--beheer-text-muted) italic">Nog geen reizen gepland...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}