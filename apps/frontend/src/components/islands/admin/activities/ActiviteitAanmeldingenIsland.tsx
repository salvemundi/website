'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Search, Download, UserPlus, QrCode } from 'lucide-react';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/admin/aanmeldingen.actions';
import ManualSignupModal from './ManualSignupModal';
import { useRouter } from 'next/navigation';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';

// Refactored Modules
import { getSignupName, getSignupEmail, getSignupPhone } from '@/lib/activity-signup.utils';
import { exportSignupsToCSV } from '@/lib/activity-export';
import ActivitySignupTable from '@/components/admin/activities/ActivitySignupTable';

export interface Signup {
    id: number;
    participant_name: string;
    participant_email: string;
    participant_phone?: string | null;
    payment_status?: string;
    created_at: string;
    checked_in?: boolean;
    checked_in_at?: string | null;
    is_member?: boolean;
    directus_relations?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string | null;
    } | null;
}

export interface AdminEvent {
    id: number | string;
    name: string;
    price_members?: number | null;
    committee_id?: number | string | null;
    max_sign_ups?: number | null;
}

/**
 * ActiviteitAanmeldingenIsland: Beheert de deelnemerslijst van een activiteit.
 * Onder de 300 regels door extractie van tabel-UI, export-logica en utilities.
 */
export default function ActiviteitAanmeldingenIsland({ 
    event, 
    initialSignups = [], 
    canAccessEdit = false
}: { 
    event: AdminEvent;
    initialSignups: Signup[]; 
    canAccessEdit?: boolean;
}) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [_isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // 1. Optimistic State
    const [optimisticSignups, setOptimisticSignups] = useOptimistic(
        initialSignups || [],
        (state: Signup[], { id, checkedIn }: { id: number; checkedIn: boolean }) =>
            state.map(s => s.id === id ? { ...s, checked_in: checkedIn } : s)
    );

    // 2. Filtering & Deduplication
    const filteredSignups = useMemo(() => {
        const map = new Map();
        for (const signup of optimisticSignups) {
            const emailKey = getSignupEmail(signup).toLowerCase();
            const idKey = signup.directus_relations?.id || emailKey;
            const key = idKey === '-' ? signup.participant_name : idKey;

            if (!map.has(key)) {
                map.set(key, signup);
            } else {
                const existing = map.get(key);
                if (signup.payment_status === 'paid' && existing.payment_status !== 'paid') {
                    map.set(key, signup);
                }
            }
        }
        
        const deduplicated = Array.from(map.values()) as Signup[];
        const sorted = deduplicated.sort((a, b) => {
            if (a.is_member && !b.is_member) return -1;
            if (!a.is_member && b.is_member) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        if (!searchQuery) return sorted;
        const query = searchQuery.toLowerCase();
        return sorted.filter(signup => {
            const name = getSignupName(signup).toLowerCase();
            const email = getSignupEmail(signup).toLowerCase();
            const phone = getSignupPhone(signup).toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [optimisticSignups, searchQuery]);

    // 4. Action Handlers
    async function handleToggleCheckIn(signupId: number, currentCheckedIn: boolean) {
        const newValue = !currentCheckedIn;
        startTransition(async () => {
            setOptimisticSignups({ id: signupId, checkedIn: newValue });
            const res = await toggleCheckInAction(signupId, Number(event.id), newValue);
            if (!res.success) {
                showToast(res.error || 'Fout bij bijwerken check-in', 'error');
            } else {
                showToast(`Check-in ${newValue ? 'voltooid' : 'ongedaan gemaakt'}`, 'success');
                router.refresh();
            }
        });
    }

    async function handleDelete(signupId: number, email: string) {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen? De persoon krijgt hiervan een email notificatie.')) {
            return;
        }

        setIsDeleting(signupId);
        const res = await deleteSignupAction(signupId, event.id, email, event.name);
        if (!res.success) {
            showToast(res.error || 'Fout bij verwijderen', 'error');
        } else {
            showToast('Aanmelding verwijderd', 'success');
            router.refresh();
        }
        setIsDeleting(null);
    }


    return (
        <div className="w-full">
            <div className="flex flex-col gap-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex flex-wrap items-center gap-1.5 order-2 sm:order-1">
                        <Link
                            href={`/beheer/activiteiten/${event.id}/scanner`}
                            className="md:hidden flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--theme-purple)] text-white font-semibold text-xs rounded-xl shadow-lg shadow-[var(--theme-purple)]/20 transition-all active:scale-95 border border-white/10"
                        >
                            <QrCode className="h-3.5 w-3.5" />
                            Scanner
                        </Link>
                        <button
                            onClick={() => exportSignupsToCSV(filteredSignups, event.name)}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-xl text-xs font-semibold hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                        >
                            <Download className="h-3.5 w-3.5" />
                            Exporteer
                        </button>
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--beheer-accent)] text-white font-semibold text-xs rounded-xl shadow-lg hover:opacity-90 transition-all active:scale-95 border border-white/10"
                            >
                                <UserPlus className="h-3.5 w-3.5" />
                                Handmatig
                            </button>
                        )}
                    </div>

                    {/* Search Bar */}
                    <div className="relative group w-full sm:w-[320px] order-1 sm:order-2">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--beheer-text-muted)] opacity-40 group-focus-within:text-[var(--beheer-accent)] group-focus-within:opacity-100 transition-all" />
                        <input
                            type="text"
                            placeholder="Zoek deelnemers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="beheer-input w-full pl-11! pr-4 py-2"
                        />
                    </div>
                </div>




                <ManualSignupModal
                    isOpen={isManualModalOpen}
                    onClose={() => setIsManualModalOpen(false)}
                    eventId={event.id}
                    eventName={event.name}
                />

                {/* Table Section */}
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] overflow-hidden">
                    {filteredSignups.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--beheer-card-soft)] mb-6">
                                <Search className="h-10 w-10 text-[var(--beheer-text-muted)] opacity-20" />
                            </div>
                            <h3 className="text-xl font-semibold text-[var(--beheer-text)] mb-2 tracking-tighter">Geen resultaten</h3>
                            <p className="text-[var(--beheer-text-muted)] font-semibold tracking-widest text-[10px] max-w-xs mx-auto">
                                {searchQuery ? "We konden niemand vinden die voldoet aan je zoekopdracht." : "Er zijn nog geen aanmeldingen voor deze activiteit."}
                            </p>
                        </div>
                    ) : (
                        <ActivitySignupTable 
                            signups={filteredSignups}
                            canAccessEdit={canAccessEdit}
                            onToggleCheckIn={handleToggleCheckIn}
                            onDelete={handleDelete}
                            isDeletingId={isDeleting}
                        />
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}
