'use client';

import { useState, useTransition, useActionState, useEffect } from 'react';
import { 
    Loader2, 
    Save, 
    Trash2, 
    CheckCircle, 
    ArrowLeft, 
    CheckCircle2
} from 'lucide-react';
import { 
    updateTripSignup, 
    deleteTripSignup, 
    updateSignupActivities 
} from '@/server/actions/reis-admin-signups.actions';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import { differenceInYears } from 'date-fns';
import { useRouter } from 'next/navigation';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { Shield, Clock, User, CreditCard } from 'lucide-react';

import SignupForm from './reis/SignupForm';
import SignupActivities from './reis/SignupActivities';

interface ReisDeelnemerDetailIslandProps {
    initialSignup: TripSignup;
    trips: Trip[];
    allActivities: TripActivity[];
    initialSelectedActivities: number[];
}

export default function ReisDeelnemerDetailIsland({ 
    initialSignup, 
    trips,
    allActivities, 
    initialSelectedActivities 
}: ReisDeelnemerDetailIslandProps) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [state, formAction, isSaving] = useActionState(updateTripSignup, null);
    const [selectedActivities, setSelectedActivities] = useState<number[]>(initialSelectedActivities);
    const [isUpdatingActivities, setIsUpdatingActivities] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
        } catch (err) {
            showToast('Geen verbinding met de server', 'error');
        } finally {
            setIsUpdatingActivities(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
        
        startTransition(async () => {
            const res = await deleteTripSignup(initialSignup.id);
            if (res.success) {
                router.push('/beheer/reis');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
        });
    };

    const age = initialSignup.date_of_birth ? differenceInYears(new Date(), new Date(initialSignup.date_of_birth)) : '?';
    const paymentStatus = initialSignup.full_payment_paid ? 'Voldaan' : initialSignup.deposit_paid ? 'Aanbetaling' : 'Niet betaald';
    
    const adminStats = [
        { label: 'Status', value: initialSignup.status === 'confirmed' ? 'Bevestigd' : 'Afwachtend', icon: CheckCircle2 },
        { label: 'Leeftijd', value: `${age} jaar`, icon: User },
        { label: 'Betaling', value: paymentStatus, icon: CreditCard },
        { label: 'Rol', value: initialSignup.role === 'crew' ? 'Crew' : 'Deelnemer', icon: Shield },
    ];

    useEffect(() => {
        if (state?.success && !isSaving) {
            showToast('Deelnemer details succesvol bijgewerkt', 'success');
        } else if (state?.error && !isSaving) {
            showToast(state.error, 'error');
        }
    }, [state, isSaving, showToast]);

    const selectedTrip = (trips || []).find(t => t.id === initialSignup.trip_id);

    return (
        <>
            <AdminToolbar 
                title={`${initialSignup.first_name} ${initialSignup.last_name}`}
                subtitle={`Beheer details voor deze deelnemer aan ${selectedTrip?.name || 'de reis'}`}
                backHref="/beheer/reis"
                actions={
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isPending}
                        className="px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-[10px] border border-[var(--beheer-inactive)]/20 hover:bg-[var(--beheer-inactive)]/20 transition-all flex items-center gap-2"
                    >
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        Verwijderen
                    </button>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in duration-700">
                <AdminStatsBar stats={adminStats} />

                <form action={formAction} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <input type="hidden" name="id" value={initialSignup.id} />
                    <div className="lg:col-span-2 space-y-8">
                        <SignupForm signup={initialSignup} />
                    </div>

                    <div className="space-y-8">
                        <SignupActivities 
    allActivities={allActivities}
                            selectedActivities={selectedActivities}
                            onToggleActivity={toggleActivity}
                            onUpdate={handleUpdateActivities}
                            isUpdating={isUpdatingActivities}
                        />

                        <div className="bg-[var(--beheer-card-bg)]/50 backdrop-blur-sm rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-6 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                <span>Aangemeld op</span>
                                <span className="text-[var(--beheer-text)]">{initialSignup.date_created ? initialSignup.date_created.toString() : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                <span>Deelnemer ID</span>
                                <span className="text-[var(--beheer-text)]">#{initialSignup.id}</span>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-lg shadow-2xl shadow-[var(--beheer-accent)]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                            >
                                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 group-hover:scale-110 transition-transform" />}
                                <span>Opslaan</span>
                            </button>
                            
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/beheer/reis')}
                                    className="flex-1 py-4 bg-[var(--bg-main)] hover:bg-[var(--beheer-border)]/10 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] rounded-2xl font-black uppercase tracking-widest text-[10px] border border-[var(--beheer-border)] transition-all flex items-center justify-center gap-3"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Annuleren
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="p-4 bg-[var(--beheer-inactive)]/5 hover:bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-2xl border border-[var(--beheer-inactive)]/20 transition-all shadow-sm"
                                >
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
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
