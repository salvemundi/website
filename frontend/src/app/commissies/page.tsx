'use client';

import Link from 'next/link';
import PageHeader from '@/shared/components/ui/PageHeader';
import { useSalvemundiCommitteesWithMembers } from '@/hooks/useSalvemundiApi';
import { getImageUrl } from '@/lib/api/salvemundi';
import { slugify } from '@/lib/utils/slug';
import { Users } from 'lucide-react';
import CommitteeImage from '@/shared/components/ui/CommitteeImage';

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name.replace(/\s*\|\|\s*SALVE MUNDI\s*/gi, '').trim();
}

// Helper function to get a default committee image
function getDefaultCommitteeImage(committeeId: number): string {
    return committeeId % 2 === 0 ? '/img/group-jump.gif' : '/img/groupgif.gif';
}

export default function CommitteesPage() {
    const { data: committeesData = [], isLoading, error } = useSalvemundiCommitteesWithMembers();

    // Sort committees so Bestuur is first
    const committeesWithMembers = [...committeesData].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    return (
        <>
            <div className="relative z-10">
                <PageHeader
                    title="COMMISSIES"
                    backgroundImage="/img/backgrounds/commissies-banner.jpg"
                >
                    <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-white/90 sm:text-xl">
                        Ontdek onze commissies en word deel van het team
                    </p>
                </PageHeader>

                <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                    {isLoading ? (
                        <div className="grid auto-rows-auto gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div
                                    key={i}
                                    className={`h-96 animate-pulse rounded-3xl bg-white/60 dark:bg-surface-dark/60 ${i === 1 ? 'md:col-span-2' : ''}`}
                                />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl bg-white/80 dark:bg-surface-dark/80 p-8 text-center shadow-lg">
                            <p className="mb-2 text-lg font-semibold text-paars dark:text-oranje">Fout bij laden van commissies</p>
                            <p className="text-sm text-slate-600 dark:text-ink-muted">{String(error)}</p>
                        </div>
                    ) : committeesWithMembers.length === 0 ? (
                        <div className="rounded-3xl bg-white/80 dark:bg-surface-dark/80 p-8 text-center shadow-lg">
                            <p className="text-lg text-slate-600 dark:text-ink-muted">Geen commissies gevonden</p>
                        </div>
                    ) : (
                        <div className="grid auto-rows-auto gap-6 md:grid-cols-2 lg:grid-cols-4">
                            {committeesWithMembers.map((committee) => {
                                const isBestuur = cleanCommitteeName(committee.name).toLowerCase().includes('bestuur');

                                const members = committee.committee_members
                                    ?.filter((member: any) => member.is_visible && member.user_id?.avatar)
                                    .map((member: any) => ({
                                        image: getImageUrl(member.user_id.avatar),
                                        firstName: member.user_id.first_name || '',
                                        isLeader: Boolean(member.is_leader),
                                    })) || [];

                                return (
                                    <div
                                        key={committee.id}
                                        className={`${isBestuur ? 'md:col-span-2 lg:col-span-2' : ''}`}
                                    >
                                        <Link
                                            href={`/commissies/${slugify(cleanCommitteeName(committee.name))}`}
                                            className={`group flex h-full flex-col overflow-hidden rounded-3xl bg-white/90 dark:bg-surface-dark/90 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${isBestuur ? 'ring-4 ring-geel/30' : ''
                                                }`}
                                        >
                                            <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-oranje/20 to-paars/20">
                                                <CommitteeImage
                                                    src={committee.image ? getImageUrl(committee.image) : getDefaultCommitteeImage(committee.id)}
                                                    alt={cleanCommitteeName(committee.name)}
                                                    className="h-full w-full transition duration-700 group-hover:scale-105"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = getDefaultCommitteeImage(committee.id);
                                                    }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 pointer-events-none" />
                                                {isBestuur && (
                                                    <div className="absolute right-4 top-4 rounded-full bg-geel px-3 py-1 text-xs font-bold text-samu shadow-lg">
                                                        BESTUUR
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col p-6">
                                                <h3 className="mb-2 text-2xl font-bold text-ink dark:text-ink-dark">
                                                    {cleanCommitteeName(committee.name)}
                                                </h3>
                                                <p className="mb-4 flex-1 text-sm leading-relaxed text-ink-muted dark:text-ink-muted/80 line-clamp-3">
                                                    {committee.short_description || 'Geen beschrijving beschikbaar'}
                                                </p>

                                                {members.length > 0 && (
                                                    <div className="flex items-center gap-2 pt-4">
                                                        <Users className="h-4 w-4 text-oranje" />
                                                        <div className="flex -space-x-2">
                                                            {members.slice(0, 5).map((member: any, idx: number) => (
                                                                <img
                                                                    key={idx}
                                                                    src={member.image}
                                                                    alt={member.firstName}
                                                                    className="h-8 w-8 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = '/img/placeholder.svg';
                                                                    }}
                                                                />
                                                            ))}
                                                            {members.length > 5 && (
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-oranje/20 text-xs font-semibold text-oranje">
                                                                    +{members.length - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-oranje">
                                                    Meer lezen
                                                    <span className="transition group-hover:translate-x-1">→</span>
                                                </div>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
