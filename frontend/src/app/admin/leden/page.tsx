'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import {
    Users,
    Search,
    UserCheck,
    UserMinus,
    ChevronRight,
    Calendar,
    Mail,
    RefreshCw
} from 'lucide-react';
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
    const { user, isLoading: authLoading } = useAuth();
    const [members, setMembers] = useState<Member[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
        if (user && !user.entra_id) {
            router.push('/admin/no-access');
        }
    }, [user, authLoading, router]);

    const loadMembers = async () => {
        setIsLoading(true);
        try {
            // Fetch all users with relevant fields
            const data = await directusFetch<Member[]>('/users?fields=id,first_name,last_name,email,date_of_birth,membership_expiry,status&limit=-1');
            setMembers(data.filter(isRealUser));
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
            const isMembershipActive = m.membership_expiry ? new Date(m.membership_expiry) > now : false;

            if (activeTab === 'active') {
                return isMembershipActive;
            } else {
                return !isMembershipActive;
            }
        });
    }, [members, searchQuery, activeTab]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full md:w-auto">
                        <button
                            onClick={() => setActiveTab('active')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'active'
                                ? 'bg-white dark:bg-slate-700 text-theme-purple shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <UserCheck className="h-4 w-4" />
                            Actief ({members.filter(m => m.membership_expiry && new Date(m.membership_expiry) > new Date()).length})
                        </button>
                        <button
                            onClick={() => setActiveTab('inactive')}
                            className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'inactive'
                                ? 'bg-white dark:bg-slate-700 text-theme-purple shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                }`}
                        >
                            <UserMinus className="h-4 w-4" />
                            Niet Actief ({members.filter(m => !m.membership_expiry || new Date(m.membership_expiry) <= new Date()).length})
                        </button>
                    </div>

                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Zoek op naam, email of geboortedatum..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white dark:bg-slate-800 border-none shadow-lg focus:ring-2 focus:ring-theme-purple outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        onClick={loadMembers}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-lg hover:text-theme-purple transition-all"
                        title="Verversen"
                    >
                        <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                {/* Desktop List */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden hidden md:block">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lid</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Geboortedatum</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Lidmaatschap tot</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actie</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {filteredMembers.map((member) => (
                                <tr
                                    key={member.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple font-bold">
                                                {member.first_name?.[0]}{member.last_name?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-slate-100">
                                                    {member.first_name} {member.last_name}
                                                </p>
                                                <p className="text-xs text-slate-400">ID: {member.id.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Mail className="h-3 w-3" />
                                            {member.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-sm">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(member.date_of_birth)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${member.membership_expiry && new Date(member.membership_expiry) > new Date()
                                            ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                            : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                            }`}>
                                            {formatDate(member.membership_expiry)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => router.push(`/admin/leden/${member.id}`)}
                                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-theme-purple hover:text-white dark:hover:bg-theme-purple transition-all shadow-sm"
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
                            <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Geen leden gevonden die voldoen aan de filters.</p>
                        </div>
                    )}
                </div>

                {/* Mobile List */}
                <div className="md:hidden space-y-4">
                    {filteredMembers.map((member) => (
                        <div key={member.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-slate-50 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple font-bold text-lg">
                                        {member.first_name?.[0]}{member.last_name?.[0]}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-slate-100">
                                            {member.first_name} {member.last_name}
                                        </h3>
                                        <p className="text-xs text-slate-400">{member.email}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${member.membership_expiry && new Date(member.membership_expiry) > new Date()
                                    ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                    }`}>
                                    {member.membership_expiry && new Date(member.membership_expiry) > new Date() ? 'Actief' : 'Niet Actief'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-slate-400 text-xs mb-1">Geboortedatum</p>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(member.date_of_birth)}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400 text-xs mb-1">Vervaldatum</p>
                                    <p className="text-slate-600 dark:text-slate-300 font-medium">{formatDate(member.membership_expiry)}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/admin/leden/${member.id}`)}
                                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-theme-purple hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                            >
                                Beheer Profiel
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="py-10 text-center">
                            <p className="text-slate-500 font-medium">Geen leden gevonden.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
