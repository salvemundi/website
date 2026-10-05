'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Search, Download, UserPlus, QrCode, Mail } from 'lucide-react';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import ManualSignupModal from './ManualSignupModal';
import EventMailModal from './EventMailModal';
import { useRouter } from 'next/navigation';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
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
                <div className="section-header-responsive">
                    <div className="action-strip-responsive">
                        <Link
                            href={`/beheer/activiteiten/${event.id}/scanner`}
                            className="btn-scanner-mobile"
                        >
                            <QrCode className="size-3.5" />
                            Scanner
                        </Link>
                        <button
                            onClick={() => exportSignupsToCSV(filteredSignups, event.name)}
                            disabled={filteredSignups.length === 0}
                            className="beheer-button-secondary"
                            type="button">
                            <Download className="size-3.5" />
                            Exporteer
                        </button>
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsManualModalOpen(true)}
                                className="beheer-button-secondary"
                                type="button">
                                <UserPlus className="size-3.5" />
                                Handmatig
                            </button>
                        )}
                        {canAccessEdit && (
                            <button
                                onClick={() => setIsMailModalOpen(true)}
                                disabled={optimisticSignups.length === 0}
                                className="beheer-button-secondary"
                                type="button">
                                <Mail className="size-3.5" />
                                Mail
                            </button>
                        )}
                    </div>

                    <div className="order-1 form-row-sm sm:order-2 sm:w-auto">
                        <div className="filter-select-box">
                            <label className="filter-label">Betaling:</label>
                            <select
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value as 'all' | 'paid' | 'open')}
                                className="beheer-select filter-select-input"
                            >
                                <option value="all" className="bg-beheer-card-bg">Alle</option>
                                <option value="paid" className="bg-beheer-card-bg">Betaald</option>
                                <option value="open" className="bg-beheer-card-bg">Open</option>
                            </select>
                        </div>

                        <div className="filter-select-box">
                            <label className="filter-label">Lidmaatschap:</label>
                            <select
                                value={membershipFilter}
                                onChange={(e) => setMembershipFilter(e.target.value as 'all' | 'member' | 'guest')}
                                className="beheer-select filter-select-input"
                            >
                                <option value="all" className="bg-beheer-card-bg">Alle</option>
                                <option value="member" className="bg-beheer-card-bg">Lid</option>
                                <option value="guest" className="bg-beheer-card-bg">Gast</option>
                            </select>
                        </div>

                        <div className="search-bar sm:w-70">
                            <Search className="size-4 shrink-0 text-beheer-text-muted" />
                            <input
                                type="text"
                                placeholder="Zoek deelnemers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="beheer-input p-0"
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

                <div className="table-card-container">
                    {filteredSignups.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="empty-state-icon-bg">
                                <Search className="size-10 text-beheer-text-muted opacity-20" />
                            </div>
                            <h3 className="empty-state-title">Geen resultaten</h3>
                            <p className="empty-state-desc">
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
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}