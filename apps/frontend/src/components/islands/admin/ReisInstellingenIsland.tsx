'use client';

import { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { 
    Plus, 
    Info 
} from 'lucide-react';
import { 
    createTrip, 
    updateTrip, 
    deleteTrip,
    toggleReisVisibility
} from '@/server/actions/reis-admin-core.actions';
import AdminVisibilityToggle from '@/components/ui/admin/AdminVisibilityToggle';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Modular Components
import TripCard from '@/components/admin/reis/TripCard';
import TripForm from '@/components/admin/reis/TripForm';

interface ReisInstellingenIslandProps {
    initialTrips: Trip[];
    initialSettings: { show: boolean };
}

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, any>;
}

export default function ReisInstellingenIsland({ initialTrips, initialSettings }: ReisInstellingenIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();
    const [trips, setTrips] = useState<Trip[]>(initialTrips);
    const [settings, setSettings] = useState(initialSettings);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Sync state with server data after revalidation
    useEffect(() => {
        setTrips(initialTrips);
        setSettings(initialSettings);
    }, [initialTrips, initialSettings.show]);

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
            } catch (err) {
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
        } catch (err) {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsDeleting(null);
        }
    };

    return (
        <>
            <AdminToolbar 
                title="Reis Instellingen"
                subtitle="Configureer reis details, prijzen en algemene instellingen"
                backHref="/beheer/reis"
                actions={
                    <div className="flex items-center gap-4">
                        <AdminVisibilityToggle 
                            isVisible={settings.show}
                            onToggle={handleToggleVisibility}
                            isPending={isPending}
                            label="Globale Zichtbaarheid"
                        />
                        <button
                            onClick={handleAdd}
                            className="px-6 py-2.5 bg-[var(--beheer-accent)] hover:opacity-90 text-white rounded-xl font-semibold tracking-widest text-[10px] shadow-lg transition-all active:scale-95 flex items-center gap-2 group border border-white/10"
                        >
                            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                            <span>Nieuwe Reis</span>
                        </button>
                    </div>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                {/* Form (Add/Edit) */}
                {(isAdding || editingTrip) && (
                    <TripForm 
                        editingTrip={editingTrip}
                        isAdding={isAdding}
                        onCancel={handleCancel}
                        onSuccess={handleSuccess}
                    />
                )}

                {/* Trips List */}
                {!isAdding && !editingTrip && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 animate-in fade-in duration-1000">
                        {trips.map((trip) => (
                            <TripCard 
                                key={trip.id} 
                                trip={trip} 
                                onEdit={() => handleEdit(trip)} 
                                onDelete={() => handleDelete(trip.id)}
                                isDeleting={isDeleting === trip.id}
                            />
                        ))}
                        {trips.length === 0 && (
                            <div className="col-span-full py-20 text-center">
                                <Info className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                                <p className="text-[var(--beheer-text-muted)] font-semibold italic">Nog geen reizen gepland...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
