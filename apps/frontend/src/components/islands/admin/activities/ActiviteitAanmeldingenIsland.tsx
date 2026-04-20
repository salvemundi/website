'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import { Search, Download, Mail, Phone, CheckCircle, XCircle, Clock, Trash2, UserPlus, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { downloadCSV } from '@/lib/utils/export';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/aanmeldingen.actions';
import ManualSignupModal from './ManualSignupModal';
import { useRouter } from 'next/navigation';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import AdminStatsBar from '@/components/ui/admin/AdminStatsBar';
import AdminToast from '@/components/ui/admin/AdminToast';
import { useAdminToast } from '@/hooks/use-admin-toast';
import { Users, UserCheck, UserMinus, DollarSign } from 'lucide-react';

interface Signup {
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

interface AdminEvent {
    id: number | string;
    name: string;
    price_members?: number | null;
    committee_id?: number | string | null;
    max_sign_ups?: number | null;
}

export default function ActiviteitAanmeldingenIsland({ 
    event, 
    initialSignups = [], 
}: { 
    event: AdminEvent;
    initialSignups: Signup[]; 
}) {
    const router = useRouter();
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    // Optimistic state for check-ins
    const [optimisticSignups, setOptimisticSignups] = useOptimistic(
        initialSignups || [],
        (state: Signup[], { id, checkedIn }: { id: number; checkedIn: boolean }) =>
            state.map(s => s.id === id ? { ...s, checked_in: checkedIn } : s)
    );

    const filteredSignups = useMemo(() => {
        // Deduplicate
        const map = new Map();
        for (const signup of optimisticSignups) {
            const emailKey = getEmail(signup).toLowerCase();
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
            const name = getName(signup).toLowerCase();
            const email = getEmail(signup).toLowerCase();
            const phone = getPhone(signup).toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [optimisticSignups, searchQuery]);

    const stats = useMemo(() => {
        const base = searchQuery ? filteredSignups : (initialSignups || []);
        return {
            total: base.length,
            paid: base.filter(s => s.payment_status === 'paid').length,
            checkedIn: base.filter(s => s.checked_in).length,
            open: base.filter(s => s.payment_status === 'open').length,
        };
    }, [filteredSignups, searchQuery, initialSignups]);

    function getName(signup: Signup): string {
        if (signup.participant_name) return signup.participant_name;
        if (signup.directus_relations?.first_name) {
            return `${signup.directus_relations.first_name} ${signup.directus_relations.last_name || ''}`.trim();
        }
        return 'Onbekend';
    }

    function getEmail(signup: Signup): string {
        return signup.participant_email || signup.directus_relations?.email || '-';
    }

    function getPhone(signup: Signup): string {
        return signup.participant_phone || signup.directus_relations?.phone_number || '-';
    }

    function getMemberBadge(isMember: boolean) {
        if (isMember) {
            return (
                <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                    <CheckCircle className="h-3 w-3" />
                    Lid
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                <Clock className="h-3 w-3" />
                Niet lid
            </span>
        );
    }

    const exportToCSV = () => {
        if (filteredSignups.length === 0) return;

        const data = filteredSignups.map(signup => ({
            Naam: getName(signup),
            Email: getEmail(signup),
            Telefoon: getPhone(signup),
            Status: signup.payment_status || 'open',
            'Checked In': signup.checked_in ? 'Ja' : 'Nee',
            'Inschrijfdatum': signup.created_at ? format(new Date(signup.created_at), 'dd-MM-yyyy HH:mm', { locale: nl }) : 'Onbekend'
        }));

        const fileName = `Aanmeldingen_${(event.name || 'Activiteit').replace(/[^a-z0-9]/gi, '_')}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        downloadCSV(data, fileName);
    };

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
                            onClick={exportToCSV}
                            disabled={filteredSignups.length === 0}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] text-[var(--beheer-text)] rounded-[var(--beheer-radius)] text-xs font-black uppercase tracking-widest hover:border-[var(--beheer-accent)]/50 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            Exporteer
                        </button>
                        <button
                            onClick={() => setIsManualModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-[var(--beheer-btn-px)] py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] text-white font-black text-xs uppercase tracking-widest rounded-[var(--beheer-radius)] shadow-[var(--shadow-glow)] hover:opacity-90 transition-all active:scale-95"
                        >
                            <UserPlus className="h-4 w-4" />
                            Handmatig
                        </button>
                    </>
                }
            />

            <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                        className="w-full pl-11 pr-5 py-3 rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] bg-[var(--beheer-card-bg)] text-[var(--beheer-text)] placeholder:text-[var(--beheer-text-muted)] focus:ring-2 focus:ring-[var(--beheer-accent)]/20 focus:border-[var(--beheer-accent)] outline-none transition-all shadow-sm font-bold uppercase tracking-widest text-[10px]"
                    />
                </div>

            <ManualSignupModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                eventId={event.id}
                eventName={event.name}
                eventPrice={event.price_members || 0}
            />

            {/* Table */}
                <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-sm ring-1 ring-[var(--beheer-border)] overflow-hidden">
                    {filteredSignups.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--beheer-card-soft)] mb-6">
                                <Search className="h-10 w-10 text-[var(--beheer-text-muted)] opacity-20" />
                            </div>
                            <h3 className="text-xl font-black text-[var(--beheer-text)] mb-2 uppercase tracking-tighter">Geen resultaten</h3>
                            <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px] max-w-xs mx-auto">
                                {searchQuery ? "We konden niemand vinden die voldoet aan je zoekopdracht." : "Er zijn nog geen aanmeldingen voor deze activiteit."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[10px] uppercase font-black tracking-widest text-[var(--beheer-text-muted)]">
                                        <th className="px-6 py-4">Inchecken</th>
                                        <th className="px-6 py-4">Deelnemer</th>
                                        <th className="px-6 py-4">Contact</th>
                                        <th className="px-6 py-4">Lidmaatschap & Datum</th>
                                        <th className="px-6 py-4 text-right">Acties</th>
                                    </tr>
                                </thead>
                            <tbody className="divide-y divide-[var(--beheer-border)]">
                                {filteredSignups.map(signup => {
                                    const name = getName(signup);
                                    const email = getEmail(signup);
                                    const phone = getPhone(signup);
                                    const isRowDeleting = isDeleting === signup.id;
                                    
                                    return (
                                        <tr key={signup.id} className={`group hover:bg-[var(--beheer-card-soft)] transition-colors ${isRowDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1.5">
                                                    <button
                                                        onClick={() => handleToggleCheckIn(signup.id, !!signup.checked_in)}
                                                        className={`flex items-center gap-2 self-start px-3 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-wider border shadow-sm active:scale-95 ${
                                                            signup.checked_in 
                                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                                                            : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] border-[var(--beheer-border)] hover:border-emerald-500/50 hover:text-emerald-500'
                                                        }`}
                                                    >
                                                        {signup.checked_in ? (
                                                            <>
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                <span>Ingecheckt</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Circle className="h-4 w-4" />
                                                                <span>Inchecken</span>
                                                            </>
                                                        )}
                                                    </button>
                                                    {signup.checked_in && signup.checked_in_at && (
                                                        <div className="flex items-center gap-1 text-[9px] text-[var(--beheer-text-muted)] opacity-60 font-black tracking-tight ml-1">
                                                            <Clock className="h-3 w-3" />
                                                            {format(new Date(signup.checked_in_at), 'HH:mm')}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="font-black text-[var(--beheer-text)] text-sm uppercase tracking-tight mb-1">{name}</div>
                                            </td>
                                            <td className="px-6 py-5 space-y-1.5">
                                                <div className="flex items-center gap-2 text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-tight">
                                                    <Mail className="h-3.5 w-3.5 opacity-50" />
                                                    <a href={`mailto:${email}`} className="hover:text-[var(--beheer-accent)] transition-colors">{email}</a>
                                                </div>
                                                {phone && phone !== '-' && (
                                                    <div className="flex items-center gap-2 text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-tight">
                                                        <Phone className="h-3.5 w-3.5 opacity-50" />
                                                        <a href={`tel:${phone}`} className="hover:text-[var(--beheer-accent)] transition-colors">{phone}</a>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="mb-2">
                                                    {getMemberBadge(!!signup.is_member)}
                                                </div>
                                                <div className="text-[10px] text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest">
                                                    {signup.created_at && !isNaN(new Date(signup.created_at).getTime()) 
                                                        ? format(new Date(signup.created_at), 'dd MMM yyyy, HH:mm', { locale: nl }) 
                                                        : 'Datum onbekend'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => handleDelete(signup.id, email)}
                                                    className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-[var(--beheer-text-muted)] opacity-30 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                                    title="Verwijder aanmelding"
                                                >
                                                    {isRowDeleting ? (
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-5 w-5" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    )}
                </div>
            </div>
            <AdminToast toast={toast} onClose={hideToast} />
        </>
    );
}
