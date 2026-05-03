'use client';

import { useState, useActionState, useEffect } from 'react';
import { 
    Plus, 
    Info 
} from 'lucide-react';
import { 
    createTrip, 
    updateTrip, 
    deleteTrip 
} from '@/server/actions/reis-admin-core.actions';
import type { Trip } from '@salvemundi/validations/schema/admin-reis.zod';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Modular Components
import TripCard from '@/components/admin/reis/TripCard';
import TripForm from '@/components/admin/reis/TripForm';

interface ReisInstellingenIslandProps {
    initialTrips: Trip[];
}

interface ActionState {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: Record<string, any>;
}

export default function ReisInstellingenIsland({ initialTrips }: ReisInstellingenIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [trips, setTrips] = useState<Trip[]>(initialTrips);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const [createState, createAction, isCreating] = useActionState<ActionState | null, FormData>(createTrip, null);
    const [updateState, updateAction, isUpdating] = useActionState<ActionState | null, FormData>(updateTrip, null);

    const handleEdit = (trip: Trip) => {
        setEditingTrip(trip);
        setIsAdding(false);
    };

    const handleAdd = () => {
        setEditingTrip(null);
        setIsAdding(true);
    };

    const handleCancel = () => {
        setEditingTrip(null);
        setIsAdding(false);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze reis wilt verwijderen? Dit verwijdert ook alle aanmeldingen!')) return;
        
        setIsDeleting(id);
        try {
            const res = await deleteTrip(id);
            if (res.success) {
                setTrips(prev => prev.filter(t => t.id !== id));
                showToast('Reis succesvol verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        } catch (err) {
            showToast('Er is een fout opgetreden', 'error');
        } finally {
            setIsDeleting(null);
        }
    };

    const state = editingTrip ? updateState : createState;
    const pending = editingTrip ? isUpdating : isCreating;

    if (state?.success && (isAdding || editingTrip)) {
        window.location.reload();
    }

    useEffect(() => {
        if (state?.error && !pending) {
            showToast(state.error, 'error');
        }
    }, [state, pending, showToast]);

    return (
        <>
            <AdminToolbar 
                title="Reis Instellingen"
                subtitle="Configureer reis details, prijzen en algemene instellingen"
                backHref="/beheer/reis"
                actions={
                    <button
                        onClick={handleAdd}
                        className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-90 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-xs shadow-[var(--shadow-glow)] transition-all active:scale-95 flex items-center gap-2 group"
                    >
                        <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                        <span>Nieuw</span>
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                {/* Form (Add/Edit) */}
                {(isAdding || editingTrip) && (
                    <TripForm 
                        editingTrip={editingTrip}
                        isAdding={isAdding}
                        onCancel={handleCancel}
                        state={state}
                        pending={pending}
                        createAction={createAction}
                        updateAction={updateAction}
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
                                <Info className="h-12 w-12 text-[var(--text-muted)] mx-auto mb-4 opacity-20" />
                                <p className="text-[var(--text-muted)] font-bold italic">Nog geen reizen gepland...</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
