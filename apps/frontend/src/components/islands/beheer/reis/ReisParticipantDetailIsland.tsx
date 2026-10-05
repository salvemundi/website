'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import {
    Loader2,
    Save,
    Trash,
    ArrowLeft,
    CheckCircle2,
    Shield,
    User,
    CreditCard
} from 'lucide-react';
import {
    updateTripSignup,
    deleteTripSignup,
    updateSignupActivities
} from '@/server/actions/beheer/reis/beheer-reis-signups.actions';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations';
import { useRouter } from 'next/navigation';
import BeheerToolbar from '@/components/ui/beheer/BeheerToolbar';
import BeheerStatsBar from '@/components/ui/beheer/BeheerStatsBar';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
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
            <BeheerToolbar
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
                        className="beheer-button-secondary text-theme-error"
                    >
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash className="size-4" />}
                        <span>Verwijderen</span>
                    </button>
                }
            />

            <div className="admin-container-padded">
                <BeheerStatsBar stats={adminStats} />

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

                        <div className="relative space-y-4 card-base p-6">
                            <div className="stat-row-between">
                                <span>Aangemeld op</span>
                                <span className="font-semibold text-text-main">
                                    {initialSignup.created_at
                                        ? formatDateTime(new Date(initialSignup.created_at))
                                        : '-'}
                                </span>
                            </div>
                            <div className="stat-row-between-bordered">
                                <span>Deelnemer ID</span>
                                <span className="font-semibold text-text-main">#{initialSignup.id}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="form-button w-full"
                            >
                                {isSaving ? <Loader2 className="mx-auto size-5 animate-spin" /> : <Save className="size-5" />}
                                <span>Gegevens Opslaan</span>
                            </button>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/beheer/reis')}
                                    className="btn-secondary flex-1"
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
                                    className="icon-button p-3 text-theme-error hover:bg-theme-error/10"
                                    aria-label="Deelnemer Verwijderen"
                                >
                                    {isPending ? <Loader2 className="size-5 animate-spin" /> : <Trash className="size-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <BeheerToast toast={toast} onClose={hideToast} />
        </>
    );
}