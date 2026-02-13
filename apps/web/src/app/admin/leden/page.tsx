'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthActions } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { getMembersAction } from '@/features/admin/server/members-data';
import { sendMembershipReminderAction } from '@/features/admin/server/members-actions';
import {
    Users,
    Search,
    UserCheck,
    UserMinus,
    ChevronRight,
    Calendar,
    Mail,
    RefreshCw,
    Bell,
    Loader2
} from 'lucide-react';
import { formatDateToLocalISO } from '@/shared/lib/utils/date';
import PageHeader from '@/widgets/page-header/ui/PageHeader';

interface Member {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    date_of_birth: string | null;
    membership_expiry: string | null;
    status: string;
}

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl',
    'github@salvemundi.nl',
    'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl',
    'voorzitter@salvemundi.nl',
    'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl',
    'penningmeester@salvemundi.nl',
    'noreply@salvemundi.nl',
    'extern@salvemundi.nl',
    'commissaris.administratie@salvemundi.nl',
    'apibot@salvemundi.nl'
];

function isRealUser(member: Member) {
    if (!member.email) return false;
    const lowerEmail = member.email.toLowerCase();
    if (EXCLUDED_EMAILS.includes(lowerEmail)) return false;
    if (lowerEmail.startsWith('test-')) return false;
    return true;
}

export default function LedenOverzichtPage() {
    const router = useRouter();
    const { user, isLoading: authLoading, isLoggingOut } = useAuth();
    const { loginWithRedirect } = useAuthActions();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
    const [isSendingMembershipReminder, setIsSendingMembershipReminder] = useState(false);

    useEffect(() => {
        if (!authLoading && !user && !isLoggingOut) {
            const returnTo = window.location.pathname + window.location.search;
            loginWithRedirect(returnTo);
        }
        if (user && !user.entra_id && !isLoggingOut) {
            router.push('/admin/no-access');
        }
    }, [user, authLoading, router, isLoggingOut]);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            // Fetch all users with relevant fields
            const data = await getMembersAction();
            console.log('Fetched members data:', data);
            setMembers(data);
        } catch (error) {
            console.error('Failed to load members:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.entra_id) {
            loadMembers();
        }
    }, [user]);

    const filteredMembers = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return members.filter(m => {
            const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
            const email = (m.email || '').toLowerCase();
            const dob = m.date_of_birth || '';

            const matchesSearch = fullName.includes(query) ||
                email.includes(query) ||
                dob.includes(query);

            if (!matchesSearch) return false;

            const now = new Date();
            const isMembershipActive = m.membership_expiry
                ? new Date(formatDateToLocalISO(m.membership_expiry) + 'T23:59:59') > now
                : false;

            if (activeTab === 'active') {
                return isMembershipActive;
            } else {
                return !isMembershipActive;
            }
        });
    }, [members, searchQuery, activeTab]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        // Use local ISO to avoid timezone shifts for display
        const localDate = formatDateToLocalISO(dateString);
        const [year, month, day] = localDate.split('-');
        return `${day}-${month}-${year}`;
    };

    const handleSendMembershipReminder = async () => {
        const confirmed = confirm(
            'Wil je een herinnering sturen naar alle leden die binnen 30 dagen hun lidmaatschap moeten verlengen?'
        );

        if (!confirmed) return;

        setIsSendingMembershipReminder(true);
        try {
            const result = await sendMembershipReminderAction(30);

            if (result.sent === 0) {
                alert('Geen leden gevonden die binnen 30 dagen hun lidmaatschap moeten verlengen.');
            } else {
                alert(`Herinnering verstuurd naar ${result.sent} ${result.sent === 1 ? 'lid' : 'leden'}!`);
            }
        } catch (error) {
            console.error('Error sending membership reminder:', error);
            alert('Fout bij het versturen van de herinneringen: ' + (error instanceof Error ? error.message : 'Onbekende fout'));
        } finally {
            setIsSendingMembershipReminder(false);
        }
    };

    if (authLoading || isLoading) {
        return (
            <>
                <PageHeader title="Leden Overzicht" description="Beheer alle Salve Mundi leden" />
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="flex items-center justify-center py-20">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <PageHeader title="Leden Overzicht" description="Lijst van alle echte gebruikers in Directus" />

            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Filters & Search */}
                <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex p-1 bg-admin-card-soft rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                                ? 'bg-admin-card text-theme-purple shadow-sm'
                                : 'text-admin-muted hover:text-admin'
                                }`}
                        >
                            <UserCheck className="h-4 w-4" />
                            Actief ({members.filter(m => m.membership_expiry && new Date(formatDateToLocalISO(m.membership_expiry) + 'T23:59:59') > new Date()).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('inactive')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'inactive'
                                ? 'bg-admin-card text-theme-purple shadow-sm'
                                : 'text-admin-muted hover:text-admin'
                                }`}
                        >
                            <UserMinus className="h-4 w-4" />
                            Niet Actief ({members.filter(m => !m.membership_expiry || new Date(formatDateToLocalISO(m.membership_expiry) + 'T23:59:59') <= new Date()).length})
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
                        <div className="relative flex-1 md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-admin-muted pointer-events-none z-20" />
                            <input
                                type="text"
                                placeholder="Zoek op naam, email of geboortedatum..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="form-input block w-full pl-10 pr-4 py-3 h-12 min-h-[44px] rounded-2xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 shadow-lg focus:ring-2 focus:ring-theme-purple outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 z-10 appearance-none"
                            />
                        </div>

                        <button
                            onClick={handleSendMembershipReminder}
                            disabled={isSendingMembershipReminder}
                            className="px-4 py-3 rounded-2xl bg-orange-600 text-white shadow-lg hover:bg-orange-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium whitespace-nowrap"
                            title="Stuur een herinnering naar leden die binnen 30 dagen hun lidmaatschap moeten verlengen"
                        >
                            {isSendingMembershipReminder ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span className="hidden sm:inline">Versturen...</span>
                                </>
                            ) : (
                                <>
                                    <Bell className="h-5 w-5" />
                                    <span className="hidden sm:inline">Stuur Herinnering</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={loadMembers}
                            className="p-3 rounded-2xl bg-admin-card text-admin-muted shadow-lg hover:text-theme-purple transition-all"
                            title="Verversen"
                        >
                            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Desktop List */}
                <div className="bg-admin-card rounded-3xl shadow-xl overflow-hidden hidden md:block">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-admin-card-soft border-b border-admin">
                                <th className="px-6 py-4 text-xs font-bold text-admin-muted uppercase tracking-wider">Lid</th>
                                <th className="px-6 py-4 text-xs font-bold text-admin-muted uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-admin-muted uppercase tracking-wider">Geboortedatum</th>
                                <th className="px-6 py-4 text-xs font-bold text-admin-muted uppercase tracking-wider">Lidmaatschap tot</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-admin-muted uppercase tracking-wider">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-admin">
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    className="hover:bg-admin-card-soft transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple font-bold">
                                                {member.first_name?.[0]}{member.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-admin">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-xs text-admin-muted">ID: {member.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-admin-muted text-sm">
                                            <Mail className="h-3 w-3" />
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-admin-muted text-sm">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(member.date_of_birth)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.membership_expiry && new Date(formatDateToLocalISO(member.membership_expiry) + 'T23:59:59') > new Date()
                                            ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                            : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                            {formatDate(member.membership_expiry)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/admin/leden/${member.id}`)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-admin-card-soft text-admin font-bold text-sm hover:bg-theme-purple hover:text-white dark:hover:bg-theme-purple transition-all shadow-sm"
                                        >
                                            Beheer
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredMembers.length === 0 && (
                        <div className="py-20 text-center">
                            <Users className="h-12 w-12 text-admin-muted mx-auto mb-4" />
                            <p className="text-admin-muted font-medium">Geen leden gevonden die voldoen aan de filters.</p>
                        </div>
                    )}
                </div>

                {/* Mobile List */}
                <div className="md:hidden space-y-4">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="bg-admin-card p-6 rounded-3xl shadow-lg border border-admin">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple font-bold text-lg">
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-admin">
                                            {member.first_name} {member.last_name}
                                        </h3>
                                        <p className="text-xs text-admin-muted">{member.email}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${member.membership_expiry && new Date(formatDateToLocalISO(member.membership_expiry) + 'T23:59:59') > new Date()
                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                    }`}>
                                    {member.membership_expiry && new Date(formatDateToLocalISO(member.membership_expiry) + 'T23:59:59') > new Date() ? 'Actief' : 'Niet Actief'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-admin-muted text-xs mb-1">Geboortedatum</p>
                                    <p className="text-admin font-medium">{formatDate(member.date_of_birth)}</p>
                                </div>
                                <div>
                                    <p className="text-admin-muted text-xs mb-1">Vervaldatum</p>
                                    <p className="text-admin font-medium">{formatDate(member.membership_expiry)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/admin/leden/${member.id}`)}
                                className="w-full py-3 rounded-2xl bg-admin-card-soft text-admin font-bold text-sm hover:bg-theme-purple hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                Beheer Profiel
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="py-10 text-center">
                            <p className="text-admin-muted font-medium">Geen leden gevonden.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
