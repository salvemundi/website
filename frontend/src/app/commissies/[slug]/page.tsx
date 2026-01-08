'use client';
import { useState } from 'react';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useSalvemundiCommitteesWithMembers, useSalvemundiEventsByCommittee, useSalvemundiCommittee } from '@/shared/lib/hooks/useSalvemundiApi';
import { useAuth } from '@/features/auth/providers/auth-provider';
import { directusFetch } from '@/shared/lib/directus';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { slugify } from '@/shared/lib/utils/slug';
import { Mail, Calendar, Users2, History, Edit,} from 'lucide-react';

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

export default function CommitteeDetailPage() {
    const params = useParams();
    const slug = params?.slug as string;

    const { data: committeesData = [], isLoading, error } = useSalvemundiCommitteesWithMembers();

    // Find committee by slug
    const committee = committeesData.find(
        (c) => slugify(cleanCommitteeName(c.name)) === slug
    );

    const committeeId = committee?.id;

    // Fetch full committee details (to get the long description/description field)
    const { data: committeeDetail } = useSalvemundiCommittee(committeeId);

    // Fetch events for this committee
    const { data: events = [] } = useSalvemundiEventsByCommittee(committeeId);
    const { user } = useAuth();
    const router = useRouter();

    // Determine leader status from application storage (preferred) or committee membership
    const storedCommittees = user?.committees || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(`user_committees_${user?.id}`) || 'null') || [] : []);
    const isLeaderFromStorage = !!storedCommittees?.find((c: any) => String(c.id) === String(committeeId) && c.is_leader);
    // we'll determine leader status after we have the visible members list

    const [membersModalOpen, setMembersModalOpen] = useState(false);

    if (isLoading) {
        return (
            <div className="relative min-h-screen" style={{backgroundColor: 'var(--bg-main)'}}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                        <div className="mx-auto max-w-app px-4 py-12">
                            <div className="h-96 animate-pulse rounded-3xl bg-white/60 dark:bg-white/10" />
                        </div>
                    </div>
                </div>
        );
    }

    if (error || !committee) {
        return (
            <div className="relative min-h-screen" style={{backgroundColor: 'var(--bg-main)'}}>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="rounded-3xl bg-white/80 dark:bg-[#1f1921] dark:border dark:border-white/10 p-8 text-center shadow-lg">
                            <p className="mb-4 text-lg font-semibold text-paars">Commissie niet gevonden</p>
                            <Link
                                href="/commissies"
                                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-oranje to-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
                            >
                                Terug naar commissies
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );    
    }

    const cleanName = cleanCommitteeName(committee.name);
    const members = committee.committee_members?.filter((m: any) => m.is_visible) || [];

    const leader = members.find((m: any) => m.is_leader);
    const isLeader = Boolean(isLeaderFromStorage || (user && leader && String(leader.user_id.id) === String(user.id)));

    const removeMember = async (memberRowId: number) => {
        try {
            if (!confirm('Weet je zeker dat je dit lid wilt verwijderen uit de commissie?')) return;
            await directusFetch(`/items/committee_members/${memberRowId}`, { method: 'DELETE' });
            window.location.reload();
        } catch (error) {
            console.error('Failed to remove member:', error);
            alert('Fout bij verwijderen van lid');
        }
    };

    const toggleLeader = async (memberRowId: number, makeLeader: boolean) => {
        try {
            await directusFetch(`/items/committee_members/${memberRowId}`, {
                method: 'PATCH',
                body: JSON.stringify({ is_leader: makeLeader }),
            });
            window.location.reload();
        } catch (error) {
            console.error('Failed to toggle leader:', error);
            alert('Fout bij bijwerken rol');
        }
    };

    return (
        <>
            <div className="relative z-10">
                {/* Hero with Committee Image */}
                <section className="relative overflow-hidden py-20">
                    <div className="absolute inset-0">
                        <Image
                            src={committee.image ? getImageUrl(committee.image) : '/img/group-jump.gif'}
                            alt={cleanName}
                            fill
                            sizes="100vw"
                            className="object-cover"
                            priority
                            quality={75}
                        />
                        {/* Semi-transparent gradient overlay with backdrop blur so the banner image is blurred underneath */}
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-paars/60 to-oranje/40 backdrop-blur-md" />
                    </div>
                    <div className="relative mx-auto max-w-app px-4 sm:px-6 lg:px-8">
                        <Link
                            href="/commissies"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-white/90 transition hover:text-white"
                        >
                            ← Terug naar commissies
                        </Link>
                        <div className="flex items-center gap-4">
                            <h1 className="text-4xl font-black text-white sm:text-5xl md:text-6xl">
                                {cleanName}
                            </h1>
                            {isLeader && (
                                <div className="ml-2 flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/commissies/${committeeId}`)}
                                        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Bewerken
                                    </button>
                                    <button
                                        onClick={() => setMembersModalOpen(true)}
                                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/20"
                                    >
                                        <Users2 className="h-4 w-4" />
                                        Beheer leden
                                    </button>
                                </div>
                            )}
                        </div>
                        {committee.short_description && (
                            <p className="mt-4 max-w-2xl text-lg text-ink-muted dark:text-white/90">
                                {committee.short_description}
                            </p>
                        )}
                    </div>
                </section>

                <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                                {/* Committee image */}
                                {committee.image && (
                                    <div className="rounded-3xl overflow-hidden bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 shadow-lg relative h-96">
                                        <Image
                                            src={getImageUrl(committee.image)}
                                            alt={cleanName}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 800px"
                                            className="object-cover"
                                            loading="lazy"
                                            placeholder="blur"
                                            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2RkZCIvPjwvc3ZnPg=="
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/img/placeholder.svg';
                                            }}
                                        />
                                    </div>
                                )}

                            {/* Short description / Overview */}
                            {committee.description && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Over {cleanName}</h2>
                                    <div
                                        className="prose max-w-none text-slate-700 dark:text-white/80"
                                        dangerouslySetInnerHTML={{ __html: committee.description }}
                                    />
                                </div>
                            )}

                            {/* Long description from Directus (if available) - render above activities */}
                            {committeeDetail?.description && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">Meer over {cleanName}</h2>
                                    <div
                                        className="prose max-w-none text-slate-700 dark:text-white/80"
                                        dangerouslySetInnerHTML={{ __html: committeeDetail.description }}
                                    />
                                </div>
                            )}

                            {/* Events */}
                            {events.length > 0 && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Activiteiten</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {events.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/activiteiten/${event.id}`}
                                                className="group rounded-2xl bg-white dark:bg-[#2a232b] p-4 shadow-sm transition hover:shadow-lg"
                                            >
                                                <div className="mb-2 flex items-center gap-2 text-sm text-paars">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(event.event_date).toLocaleDateString('nl-NL', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </div>
                                                <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-paars">
                                                    {event.name}
                                                </h3>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Committee Email Contact */}
                            {committee.email && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Commissie Contact</h3>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-paars/10 dark:bg-paars/20">
                                            <Mail className="h-6 w-6 text-paars" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-600 dark:text-white/60 mb-1">Email</p>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                                                {committee.email}
                                            </p>
                                        </div>
                                    </div>
                                    <a
                                        href={`mailto:${committee.email}`}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-paars/10 dark:bg-[#2a232b] px-4 py-2 text-sm font-semibold text-paars dark:text-white shadow-sm transition hover:bg-paars/20 dark:hover:bg-paars/30"
                                    >
                                        <Mail className="h-4 w-4" />
                                        E-mail versturen
                                    </a>
                                </div>
                            )}

                            {/* Leader Contact */}
                            {leader && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Commissieleider</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 rounded-full overflow-hidden">
                                            <Image
                                                src={getImageUrl(leader.user_id.avatar)}
                                                alt={`${leader.user_id.first_name} ${leader.user_id.last_name}`}
                                                fill
                                                sizes="64px"
                                                className="object-cover"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZGRkIi8+PC9zdmc+"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = '/img/placeholder.svg';
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white">
                                                {leader.user_id.first_name} {leader.user_id.last_name}
                                            </p>
                                            <p className="text-sm text-paars">Commissieleider</p>
                                        </div>
                                    </div>
                                    {leader.user_id.email && (
                                        <a
                                            href={`mailto:${leader.user_id.email}`}
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-paars/10 dark:bg-[#2a232b] px-4 py-2 text-sm font-semibold text-paars dark:text-white shadow-sm transition hover:bg-paars/20 dark:hover:bg-paars/30"
                                        >
                                            <Mail className="h-4 w-4" />
                                            Contact opnemen
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Members */}
                            {members.length > 0 && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                        <Users2 className="h-5 w-5 text-paars" />
                                        Leden ({members.length})
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {members.map((member: any) => (
                                            <div key={member.id} className="text-center">
                                                <div className="relative mx-auto h-16 w-16 rounded-full overflow-hidden">
                                                    <Image
                                                        src={getImageUrl(member.user_id.avatar)}
                                                        alt={`${member.user_id.first_name}`}
                                                        fill
                                                        sizes="64px"
                                                        className="object-cover"
                                                        loading="lazy"
                                                        placeholder="blur"
                                                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZGRkIi8+PC9zdmc+"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.src = '/img/placeholder.svg';
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-2 text-xs font-medium text-slate-900 dark:text-white">
                                                    {member.user_id.first_name}
                                                </p>
                                                {isLeader && (
                                                    <div className="mt-2 flex items-center justify-center gap-2">
                                                        <button onClick={() => toggleLeader(member.id, !member.is_leader)} title={member.is_leader ? 'Maak geen leider' : 'Maak leider'} className="text-sm text-paars">
                                                            {member.is_leader ? 'Leider' : 'Maak leider'}
                                                        </button>
                                                        <button onClick={() => removeMember(member.id)} title="Verwijder lid" className="text-sm text-red-600">
                                                            Verwijder
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Board History Button - Only show for Bestuur */}
                            {cleanName.toLowerCase().includes('bestuur') && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
                                        <History className="h-5 w-5 text-paars" />
                                        Geschiedenis
                                    </h3>
                                    <p className="mb-4 text-sm text-slate-600 dark:text-white/70">
                                        Bekijk alle eerdere besturen van Salve Mundi
                                    </p>
                                    <Link
                                        href="/commissies/geschiedenis"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-theme text-theme-white px-4 py-3 text-sm font-semibold shadow-lg transition hover:shadow-xl hover:-translate-y-0.5"
                                    >
                                        <History className="h-4 w-4" />
                                        Bekijk bestuursgeschiedenis
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

            </div>
            {membersModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setMembersModalOpen(false)} />
                    <div className="relative z-10 w-full max-w-3xl mx-4 bg-white rounded-2xl p-6 shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold">Beheer commissieleden</h3>
                            <button onClick={() => setMembersModalOpen(false)} className="text-sm text-slate-600">Sluiten</button>
                        </div>
                        <div className="grid gap-4">
                            {members.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between gap-4 p-3 rounded-md bg-slate-50">
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-10 w-10 rounded-full overflow-hidden">
                                            <Image
                                                src={getImageUrl(member.user_id.avatar)}
                                                alt={`${member.user_id.first_name} ${member.user_id.last_name}`}
                                                fill
                                                sizes="40px"
                                                className="object-cover"
                                                loading="lazy"
                                                placeholder="blur"
                                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZGRkIi8+PC9zdmc+"
                                            />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{member.user_id.first_name} {member.user_id.last_name}</div>
                                            <div className="text-sm text-slate-500">{member.user_id.email}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => toggleLeader(member.id, !member.is_leader)} className="px-3 py-1 rounded-md bg-paars/10 text-paars text-sm">{member.is_leader ? 'Zet geen leider' : 'Maak leider'}</button>
                                        <button onClick={() => removeMember(member.id)} className="px-3 py-1 rounded-md bg-red-50 text-red-600 text-sm">Verwijder</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
