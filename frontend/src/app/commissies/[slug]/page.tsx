'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/shared/components/sections';
import { useSalvemundiCommitteesWithMembers, useSalvemundiEventsByCommittee } from '@/hooks/useSalvemundiApi';
import { getImageUrl } from '@/lib/api/salvemundi';
import { slugify } from '@/lib/utils/slug';
import { Mail, Calendar, Users2 } from 'lucide-react';

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

    // Fetch events for this committee
    const { data: events = [] } = useSalvemundiEventsByCommittee(committeeId);

    if (isLoading) {
        return (
            <div className="relative min-h-screen bg-[#fef5f3]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <Header />
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="h-96 animate-pulse rounded-3xl bg-white/60" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !committee) {
        return (
            <div className="relative min-h-screen bg-[#fef5f3]">
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-oranje/10/80 via-transparent to-oranje/20/60" />
                <div className="relative z-10">
                    <Header />
                    <div className="mx-auto max-w-app px-4 py-12">
                        <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
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
                <Header />

                {/* Hero with Committee Image */}
                <section className="relative overflow-hidden py-20">
                    <div className="absolute inset-0">
                        <img
                            src={committee.image ? getImageUrl(committee.image) : '/img/group-jump.gif'}
                            alt={cleanName}
                            className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-paars/90 to-oranje/80" />
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
                            <p className="mt-4 max-w-2xl text-lg text-white/90">
                                {committee.short_description}
                            </p>
                        )}
                    </div>
                </section>

                <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Description */}
                            {committee.description && (
                                <div className="rounded-3xl bg-white/90 p-8 shadow-lg">
                                    <h2 className="mb-4 text-2xl font-bold text-slate-900">Over {cleanName}</h2>
                                    <div
                                        className="prose max-w-none text-slate-700"
                                        dangerouslySetInnerHTML={{ __html: committee.description }}
                                    />
                                </div>
                            )}

                            {/* Events */}
                            {events.length > 0 && (
                                <div className="rounded-3xl bg-white/90 p-8 shadow-lg">
                                    <h2 className="mb-6 text-2xl font-bold text-slate-900">Activiteiten</h2>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {events.map((event) => (
                                            <Link
                                                key={event.id}
                                                href={`/events/${event.id}`}
                                                className="group rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-lg"
                                            >
                                                <div className="mb-2 flex items-center gap-2 text-sm text-paars">
                                                    <Calendar className="h-4 w-4" />
                                                    {new Date(event.event_date).toLocaleDateString('nl-NL', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </div>
                                                <h3 className="font-semibold text-slate-900 group-hover:text-paars">
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
                                <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
                                    <h3 className="mb-4 text-lg font-bold text-slate-900">Contact</h3>
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
                                            <p className="font-semibold text-slate-900">
                                                {leader.user_id.first_name} {leader.user_id.last_name}
                                            </p>
                                            <p className="text-sm text-paars">Voorzitter</p>
                                        </div>
                                    </div>
                                    {leader.user_id.email && (
                                        <a
                                            href={`mailto:${leader.user_id.email}`}
                                            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-paars shadow-sm transition hover:bg-paars/5"
                                        >
                                            <Mail className="h-4 w-4" />
                                            Contact opnemen
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Members */}
                            {members.length > 0 && (
                                <div className="rounded-3xl bg-white/90 p-6 shadow-lg">
                                    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
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
                                                <p className="mt-2 text-xs font-medium text-slate-900">
                                                    {member.user_id.first_name}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </main>

                <Footer />
            </div>
        </>
    );
}
