'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Search, Download, UserPlus, QrCode, Mail } from 'lucide-react';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/admin/activiteiten/admin-activiteiten-signups.actions';
import ManualSignupModal from './ManualSignupModal';
import EventMailModal from './EventMailModal';
import { useRouter } from 'next/navigation';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { getSignupName, getSignupEmail, getSignupPhone } from '@/lib/activities/activity-signup.utils';
import { exportSignupsToCSV } from '@/lib/activities/activity-export';
import ActivitySignupTable from '@/components/admin/activities/ActivitySignupTable';

export interface Signup {
    id: number;
    participant_name: string;
    participant_email: string;
    participant_phone?: string | null;
    payment_status?: string;
    amount_paid?: number | null;
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
    const [, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'open'>('all');
    const [membershipFilter, setMembershipFilter] = useState<'all' | 'member' | 'guest'>('all');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const [optimisticSignups, setOptimisticSignups] = useOptimistic(
        initialSignups,
        (state: Signup[], { id, checkedIn }: { id: number; checkedIn: boolean }) =>
            state.map(s => s.id === id ? { ...s, checked_in: checkedIn } : s)
    );

    const filteredSignups = useMemo(() => {
        const map = new Map<string, Signup>();
        for (const signup of optimisticSignups) {
            const emailKey = getSignupEmail(signup).toLowerCase();
            const idKey = signup.directus_relations?.id || emailKey;
            const key = idKey === '-' ? signup.participant_name : idKey;

            if (!map.has(key)) {
                map.set(key, signup);
            } else {
                const existing = map.get(key);
                if (existing && signup.payment_status === 'paid' && existing.payment_status !== 'paid') {
                    map.set(key, signup);
                }
            }
        }

        const deduplicated = Array.from(map.values());
        const sorted = deduplicated.sort((a, b) => {
            if (a.is_member && !b.is_member) return -1;
            if (!a.is_member && b.is_member) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const filtered = sorted.filter(signup => {
            if (paymentFilter !== 'all' && (signup.payment_status || 'open') !== paymentFilter) return false;
            if (membershipFilter === 'member' && !signup.is_member) return false;
            if (membershipFilter === 'guest' && signup.is_member) return false;
            return true;
        });

        if (!searchQuery) return filtered;
        const query = searchQuery.toLowerCase();
        return filtered.filter(signup => {
            const name = getSignupName(signup).toLowerCase();
            const email = getSignupEmail(signup).toLowerCase();
            const phone = getSignupPhone(signup).toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [optimisticSignups, searchQuery, paymentFilter, membershipFilter]);

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
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen? De persoon krijgt hierover een e-mail.')) {
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
                <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                    <div className="order-2 flex flex-wrap items-center gap-1.5 sm:order-1">
                        <Link
                            href={`/beheer/activiteiten/${event.id}/scanner`}
                            className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-(--theme-purple) px-6 py-2.5 text-xs font-semibold text-white shadow-(--theme-purple)/20 shadow-lg transition-all active:scale-95 md:hidden"
                        >
                            <QrCode className="size-3.5" />
                            Scanner
                        </Link>
                        <button
                            onClick={() => exportSignupsToCSV(filteredSignups, event.name)}
                            disabled={filteredSignups.length === 0}
                            className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-6 py-2.5 text-xs font-semibold text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 active:scale-95 disabled:opacity-50"
                        >
                            <Download className="size-3.5" />
                            Exporteer
                        </button>
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-(--beheer-accent) px-6 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:opacity-90 active:scale-95"
                            >
                                <UserPlus className="size-3.5" />
                                Handmatig
                            </button>
                        )}
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsMailModalOpen(true)}
                                disabled={optimisticSignups.length === 0}
                                className="beheer-button flex items-center justify-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-6 py-2.5 text-xs font-semibold text-(--beheer-text) shadow-sm transition-all hover:border-(--beheer-accent)/50 active:scale-95 disabled:opacity-50"
                            >
                                <Mail className="size-3.5" />
                                Mail
                            </button>
                        )}
                    </div>

                    <div className="order-1 flex w-full flex-col items-stretch gap-3 sm:order-2 sm:w-auto sm:flex-row sm:items-center">
                        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 shadow-sm transition-colors hover:border-(--beheer-accent)/30">
                            <label className="text-[11px] font-semibold whitespace-nowrap text-(--beheer-text-muted) opacity-75">Betaling:</label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'open')}
                                className="beheer-select min-w-0 cursor-pointer border-none bg-transparent p-0 text-[11px] font-bold text-(--beheer-text) outline-none focus:ring-0"
                            >
                                <option value="all" className="bg-(--beheer-card-bg)">Alle</option>
                                <option value="paid" className="bg-(--beheer-card-bg)">Betaald</option>
                                <option value="open" className="bg-(--beheer-card-bg)">Open</option>
                            </select>
                        </div>

                        <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-bg) px-4 py-2.5 shadow-sm transition-colors hover:border-(--beheer-accent)/30">
                            <label className="text-[11px] font-semibold whitespace-nowrap text-(--beheer-text-muted) opacity-75">Lidmaatschap:</label>
                            <select
                                value={membershipFilter}
                                onChange={(e) => setMembershipFilter(e.target.value as 'all' | 'member' | 'guest')}
                                className="beheer-select min-w-0 cursor-pointer border-none bg-transparent p-0 text-[11px] font-bold text-(--beheer-text) outline-none focus:ring-0"
                            >
                                <option value="all" className="bg-(--beheer-card-bg)">Alle</option>
                                <option value="member" className="bg-(--beheer-card-bg)">Lid</option>
                                <option value="guest" className="bg-(--beheer-card-bg)">Gast</option>
                            </select>
                        </div>

                        <div className="group relative w-full sm:w-70">
                            <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-(--beheer-text-muted) opacity-40 transition-all group-focus-within:text-(--beheer-accent) group-focus-within:opacity-100" />
                            <input
                                type="text"
                                placeholder="Zoek deelnemers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="beheer-input w-full py-2 pr-4 pl-11!"
                            />
                        </div>
                    </div>
                </div>

                <ManualSignupModal
                    isOpen={isManualModalOpen}
                    onClose={() => setIsManualModalOpen(false)}
                    eventId={event.id}
                    eventName={event.name}
                />

                <EventMailModal
                    isOpen={isMailModalOpen}
                    onClose={() => setIsMailModalOpen(false)}
                    eventId={event.id}
                    eventName={event.name}
                    signups={optimisticSignups}
                />

                <div className="overflow-hidden rounded-(--beheer-radius) bg-(--beheer-card-bg) shadow-sm ring-1 ring-(--beheer-border)">
                    {filteredSignups.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="mb-6 inline-flex size-20 items-center justify-center rounded-full bg-(--beheer-card-soft)">
                                <Search className="size-10 text-(--beheer-text-muted) opacity-20" />
                            </div>
                            <h3 className="mb-2 text-xl font-semibold tracking-tighter text-(--beheer-text)">Geen resultaten</h3>
                            <p className="mx-auto max-w-xs text-[10px] font-semibold tracking-widest text-(--beheer-text-muted)">
                               {searchQuery ? "We konden niemand vinden die voldoet aan je zoekopdracht." : "Er zijn nog geen aanmeldingen voor deze activiteit."}
                            </p>
                        </div>
                    ) : (
                        <ActivitySignupTable
                            signups={filteredSignups}
                            canAccessEdit={canAccessEdit}
                            onToggleCheckIn={(id, checkedIn) => { void handleToggleCheckIn(id, checkedIn); }}
                            onDelete={(id, email) => { void handleDelete(id, email); }}
                            isDeletingId={isDeleting}
                        />
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </div>
    );
}