'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import {
    Loader2,
    Save,
    Trash,
    ArrowLeft,
    CheckCircle2,
    Shield,
    Clock,
    User,
    CreditCard
} from 'lucide-react';
import {
    updateTripSignup,
    deleteTripSignup,
    updateSignupActivities
} from '@/server/actions/admin/reis/admin-reis-signups.actions';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations/schema/admin-trip.zod';
import { useRouter } from 'next/navigation';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
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
        minute: '2-digit'
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
    initialData?: Record<string, FormDataEntryValue | FormDataEntryValue[] | boolean | number | null | undefined>;
}

export default function ReisParticipantDetailIsland({
    initialSignup,
    trips,
    allActivities,
    initialSelectedActivities
}: ReisParticipantDetailIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [state, formAction, isSaving] = useActionState<ActionState | null, FormData>(updateTripSignup, null);
    const [selectedActivities, setSelectedActivities] = useState<number[]>(initialSelectedActivities);
    const [isUpdatingActivities, setIsUpdatingActivities] = useState(false);

    const toggleActivity = (id: number) => {
        setSelectedActivities(prev =>
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
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
        if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;

        startTransition(async () => {
            try {
                const res = await deleteTripSignup(initialSignup.id);
                if (res.success) {
                    router.push('/beheer/reis');
                } else {
                    showToast(res.error || 'Verwijderen mislukt', 'error');
                }
            } catch (error) {
                safeConsoleError('[ReisParticipantDetailIsland.tsx][ReisParticipantDetailIsland] ', error);
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
        { label: 'Status', value: initialSignup.status === 'confirmed' ? 'Bevestigd' : 'Afwachtend', icon: CheckCircle2 },
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

    const selectedTrip = trips.find(t => t.id === initialSignup.trip_id);

    return (
        <>
            <AdminToolbar
                title={`${initialSignup.first_name} ${initialSignup.last_name}`}
                subtitle={`Beheer details voor deze reiziger aan ${selectedTrip?.name || 'de reis'}`}
                backHref="/beheer/reis"
                actions={
                    <button
                        type="button"
                        onClick={() => {
                            void handleDelete();
                        }}
                        disabled={isPending}
                        className="beheer-button flex items-center gap-2 rounded-xl border border-(--beheer-inactive)/10 bg-(--beheer-inactive)/5 px-6 py-3 text-base font-semibold text-(--beheer-inactive) shadow-sm transition-all hover:bg-(--beheer-inactive)/10 active:scale-95"
                    >
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                        <span>Verwijderen</span>
                    </button>
                }
            />

            <div className="container mx-auto max-w-7xl px-4 py-8">
                <AdminStatsBar stats={adminStats} />

                <form action={formAction} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    <input type="hidden" name="id" value={initialSignup.id} />
                    <div className="space-y-8 lg:col-span-2">
                        <ReisSignupForm
                            key={`${initialSignup.id}-${initialSignup.role}`}
                            signup={initialSignup}
                            initialData={state?.initialData}
                            isBusTrip={!!selectedTrip?.is_bus_trip}
                        />
                    </div>

                    <div className="space-y-8">
                        <ReisSignupActivities
                            allActivities={allActivities}
                            selectedActivities={selectedActivities}
                            onToggleActivity={toggleActivity}
                            onUpdate={() => {
                                void handleUpdateActivities();
                            }}
                            isUpdating={isUpdatingActivities}
                        />

                        <div className="group/meta relative space-y-5 overflow-hidden rounded-3xl border border-(--beheer-border)/50 bg-(--beheer-card-bg)/50 p-8 shadow-sm backdrop-blur-sm">
                            <div className="absolute -right-8 -bottom-8 opacity-5 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-12">
                                <Clock className="size-24 text-(--beheer-accent)" />
                            </div>
                            <div className="flex items-center justify-between text-base font-semibold text-(--beheer-text-muted) opacity-60">
                                <span>Aangemeld op</span>
                                <span className="font-semibold text-(--beheer-text)">
                                    {initialSignup.created_at
                                        ? formatDateTime(new Date(initialSignup.created_at))
                                        : '-'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-t border-(--beheer-border)/10 pt-4 text-base font-semibold text-(--beheer-text-muted) opacity-60">
                                <span>Deelnemer ID</span>
                                <span className="font-semibold text-(--beheer-text)">#{initialSignup.id}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="group active:scale-0.98 beheer-button flex w-full items-center justify-center gap-4 rounded-2xl border border-white/10 bg-(--beheer-accent) py-5 text-base font-semibold text-white shadow-(--beheer-accent)/30 shadow-2xl transition-all hover:opacity-95 disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 className="size-7 animate-spin" /> : <Save className="size-7 transition-transform group-hover:scale-110" />}
                                <span>Gegevens Opslaan</span>
                            </button>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/beheer/reis')}
                                    className="beheer-button flex flex-1 items-center justify-center gap-3 rounded-2xl border border-(--beheer-border) bg-(--bg-main)/50 py-4 text-base font-semibold text-(--beheer-text-muted) transition-all hover:bg-(--beheer-card-bg) hover:text-(--beheer-text) active:scale-95"
                                >
                                    <ArrowLeft className="size-4" />
                                    Annuleren
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleDelete();
                                    }}
                                    disabled={isPending}
                                    className="icon-button rounded-2xl border border-(--beheer-inactive)/20 bg-(--beheer-inactive)/5 p-4 text-(--beheer-inactive) shadow-sm transition-all hover:bg-(--beheer-inactive)/10 active:scale-90"
                                >
                                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash className="size-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}