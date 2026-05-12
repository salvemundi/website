'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import { Search, Download, UserPlus, Users, UserCheck } from 'lucide-react';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/admin/aanmeldingen.actions';
import ManualSignupModal from './ManualSignupModal';
import { useRouter } from 'next/navigation';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
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

    // 3. Stats Calculation
    const stats = useMemo(() => {
        const base = searchQuery ? filteredSignups : (initialSignups || []);
        return {
            total: base.length,
            checkedIn: base.filter(s => s.checked_in).length,
        };
    }, [filteredSignups, searchQuery, initialSignups]);

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

    const adminStats = [
        { label: 'Aanmeldingen', value: stats.total, icon: Users },
        { 
            label: 'Plekken over', 
            value: event.max_sign_ups 
                ? `${event.max_sign_ups - stats.total} van de ${event.max_sign_ups}` 
                : '∞', 
            icon: Users
        },
        { label: 'Ingecheckt via ticket', value: stats.checkedIn, icon: UserCheck },
    ];

    return (
        <>
            <AdminToolbar 
                title={event.name}
                subtitle="Deelnemerslijst en inchecken"
                backHref="/beheer/activiteiten"
                actions={
                    <>
                        <button
                            onClick={() => exportSignupsToCSV(filteredSignups, event.name)}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-semibold tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            Exporteer
                        </button>
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-semibold text-xs tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                            >
                                <UserPlus className="h-4 w-4" />
                                Handmatig
                            </button>
                        )}
                    </>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <AdminStatsBar stats={adminStats} />

                {/* Search Bar */}
                <div className="mb-10 relative group max-w-xl">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-20">
                        <Search className="h-4 w-4 text-[var(--beheer-text-muted)] group-focus-within:text-[var(--beheer-accent)] transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Zoek op naam, email of telefoon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoComplete="off"
                        suppressHydrationWarning
                        className="w-full pl-11 pr-5 py-3 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)] outline-none transition-all shadow-sm font-bold tracking-widest text-[10px]"
                    />
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
        </>
    );
}
