'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import {
    ChevronLeft,
    Calendar,
    Phone,
    Shield,
    Clock,
    Award,
    Hash,
    Layers
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
    phone_number: string | null;
    avatar: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        is_visible: boolean;
    };
}

export default function MemberDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user: authUser, isLoading: authLoading } = useAuth();

    const [member, setMember] = useState<Member | null>(null);
    const [committees, setCommittees] = useState<CommitteeMembership[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !authUser) {
            const returnTo = window.location.pathname + window.location.search;
            router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        }
        if (authUser && !authUser.entra_id) {
            router.push('/admin/no-access');
        }
    }, [authUser, authLoading, router]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [memberData, committeesData] = await Promise.all([
                directusFetch<Member>(`/users/${id}?fields=id,first_name,last_name,email,date_of_birth,membership_expiry,status,phone_number,avatar`),
                directusFetch<CommitteeMembership[]>(`/items/committee_members?filter[user_id][_eq]=${id}&fields=id,is_leader,committee_id.id,committee_id.name,committee_id.is_visible`)
            ]);

            setMember(memberData);
            setCommittees(committeesData);
        } catch (error) {
            console.error('Failed to load member data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (authUser?.entra_id && id) {
            loadData();
        }
    }, [authUser, id]);

    const cleanName = (name: string) => {
        return name
            .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
            .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
            .trim();
    };

    const { realCommittees, otherGroups } = useMemo(() => {
        const EXCLUDED_GROUPS = ['Alle gebruikers', 'Leden_Actief_Lidmaatschap', 'Leden_Verlopen_Lidmaatschap'];

        const real: CommitteeMembership[] = [];
        const groups: CommitteeMembership[] = [];

        committees.forEach(cm => {
            const rawName = cm.committee_id?.name || '';
            if (!rawName || EXCLUDED_GROUPS.includes(rawName)) return;

            // Items shown on website (is_visible === true) are the "real" committees
            if (cm.committee_id?.is_visible === true) {
                real.push(cm);
            } else {
                groups.push(cm);
            }
        });

        return { realCommittees: real, otherGroups: groups };
    }, [committees]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        return new Date(dateString).toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (authLoading || isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
            </div>
        );
    }

    if (!member) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Lid niet gevonden</h1>
                <button onClick={() => router.back()} className="text-theme-purple font-bold">Ga terug</button>
            </div>
        );
    }

    const isMembershipActive = member.membership_expiry ? new Date(member.membership_expiry) > new Date() : false;

    return (
        <div className="pb-20">
            <PageHeader
                title={`${member.first_name} ${member.last_name}`}
                description={`Beheer het profiel van dit lid`}
            />

            <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-5xl">
                <button
                    onClick={() => router.push('/admin/leden')}
                    className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors font-medium bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Terug naar overzicht
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-admin-card rounded-3xl shadow-xl p-8 ring-1 ring-admin-border">
                            <div className="flex flex-col items-center text-center">
                                <div className="h-24 w-24 rounded-3xl bg-theme-purple/10 flex items-center justify-center text-theme-purple font-bold text-3xl mb-4 shadow-inner">
                                    {member.first_name?.[0]}{member.last_name?.[0]}
                                </div>
                                <h2 className="text-xl font-bold text-admin mb-1">{member.first_name} {member.last_name}</h2>
                                <p className="text-admin-muted text-sm mb-4">{member.email}</p>

                                <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${isMembershipActive
                                    ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400'
                                    }`}>
                                    {isMembershipActive ? 'Actief Lid' : 'Inactief Lid'}
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">

                                <div className="flex items-center gap-3 text-admin-muted">
                                    <div className="h-8 w-8 rounded-lg bg-admin-card-soft flex items-center justify-center text-admin-muted">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-admin-muted">Geboortedatum</p>
                                        <p className="text-sm font-medium">{formatDate(member.date_of_birth)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-admin-muted">
                                    <div className="h-8 w-8 rounded-lg bg-admin-card-soft flex items-center justify-center text-admin-muted">
                                        <Phone className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-admin-muted">Telefoonnummer</p>
                                        <p className="text-sm font-medium">{member.phone_number || 'Niet opgegeven'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-admin-muted">
                                    <div className="h-8 w-8 rounded-lg bg-admin-card-soft flex items-center justify-center text-admin-muted">
                                        <Clock className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] uppercase font-bold text-admin-muted">Lidmaatschap tot</p>
                                        <p className="text-sm font-medium">{formatDate(member.membership_expiry)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Committees & More */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Committees Card */}
                        <div className="bg-admin-card rounded-3xl shadow-xl p-8 ring-1 ring-admin-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 flex items-center justify-center">
                                    <Award className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-admin">Commissies</h3>
                            </div>

                            {realCommittees.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {realCommittees.map((membership: CommitteeMembership) => (
                                        <div
                                            key={membership.id}
                                            className="p-4 rounded-2xl bg-admin-card-soft border border-admin flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-theme-purple/10 flex items-center justify-center text-theme-purple">
                                                    <Shield className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-admin">{cleanName(membership.committee_id?.name || 'Onbekend')}</p>
                                                    {membership.is_leader && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                                                            <Award className="h-3 w-3" />
                                                            Commissie Leider
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center border-2 border-dashed border-admin-border rounded-2xl">
                                    <p className="text-admin-muted font-medium italic">Niet in een commissie</p>
                                </div>
                            )}
                        </div>

                        {/* Other Groups Card */}
                        <div className="bg-admin-card rounded-3xl shadow-xl p-8 ring-1 ring-admin-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 flex items-center justify-center">
                                    <Layers className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-bold text-admin">Teams & Groepen</h3>
                            </div>

                            {otherGroups.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {otherGroups.map((membership: CommitteeMembership) => (
                                        <div
                                            key={membership.id}
                                            className="p-4 rounded-2xl bg-admin-card-soft border border-admin flex items-center justify-between"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                                    <Hash className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-admin text-sm">{cleanName(membership.committee_id?.name || 'Onbekend')}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center border-2 border-dashed border-admin-border rounded-2xl">
                                    <p className="text-admin-muted font-medium italic">Geen overige groepen</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Sections could go here (e.g., event signups, stickers, etc.) */}
                </div>
            </div>
        </div>
    );
}
