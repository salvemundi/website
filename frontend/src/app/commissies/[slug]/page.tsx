'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSalvemundiCommitteesWithMembers, useSalvemundiEventsByCommittee, useSalvemundiCommittee } from '@/shared/lib/hooks/useSalvemundiApi';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { slugify } from '@/shared/lib/utils/slug';
import { Mail, Calendar, Users2, History } from 'lucide-react';

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

    return (
        <>
            <div className="relative z-10">
                {/* Hero with Committee Image */}
                <section className="relative overflow-hidden py-20">
                    <div className="absolute inset-0">
                        <img
                            src={committee.image ? getImageUrl(committee.image) : '/img/group-jump.gif'}
                            alt={cleanName}
                            className="h-full w-full object-cover"
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
                        <h1 className="text-4xl font-black text-white sm:text-5xl md:text-6xl">
                            {cleanName}
                        </h1>
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
                                    <div className="rounded-3xl overflow-hidden bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-0 shadow-lg">
                                        <img
                                            src={getImageUrl(committee.image)}
                                            alt={cleanName}
                                            className="w-full object-cover"
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
                            {/* Leader Contact */}
                            {leader && (
                                <div className="rounded-3xl bg-white/90 dark:bg-[#1f1921] dark:border dark:border-white/10 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Contact</h3>
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={getImageUrl(leader.user_id.avatar)}
                                            alt={`${leader.user_id.first_name} ${leader.user_id.last_name}`}
                                            className="h-16 w-16 rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = '/img/placeholder.svg';
                                            }}
                                        />
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
                                                <img
                                                    src={getImageUrl(member.user_id.avatar)}
                                                    alt={`${member.user_id.first_name}`}
                                                    className="mx-auto h-16 w-16 rounded-full object-cover"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/img/placeholder.svg';
                                                    }}
                                                />
                                                <p className="mt-2 text-xs font-medium text-slate-900 dark:text-white">
                                                    {member.user_id.first_name}
                                                </p>
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
        </>
    );
}
