import Link from 'next/link';
import SmartImage from '@/shared/ui/SmartImage';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { getImageUrl } from '@/shared/lib/api/image';
import { slugify } from '@/shared/lib/utils/slug';
import { Users } from 'lucide-react';
import CommitteeImage from '@/entities/committee/ui/CommitteeImage';
import { getCommitteesWithMembers } from '@/shared/api/salvemundi-server';
import { Suspense } from 'react';
import { CardSkeleton } from '@/shared/ui/skeletons';

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

// Helper function to get a default committee image
function getDefaultCommitteeImage(committeeId: number): string {
    return committeeId % 2 === 0 ? '/img/group-jump.gif' : '/img/groupgif.gif';
}

function CommitteesSkeleton() {
    return (
        <div className="grid auto-rows-auto gap-6 md:grid-cols-2 lg:grid-cols-4 content-loaded">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className={i === 1 ? 'md:col-span-2' : ''}>
                    <CardSkeleton />
                </div>
            ))}
        </div>
    );
}

async function CommitteesList() {
    const rawCommittees = await getCommitteesWithMembers();

    // Sort committees so Bestuur is first
    const committeesWithMembers = [...rawCommittees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    if (committeesWithMembers.length === 0) {
        return (
            <div className="rounded-3xl bg-[var(--bg-card)]/80 dark:border dark:border-white/10 p-8 text-center shadow-lg">
                <p className="text-lg text-theme-muted">Geen commissies gevonden</p>
            </div>
        );
    }

    return (
        <div className="grid auto-rows-auto gap-6 md:grid-cols-2 lg:grid-cols-4 content-loaded">
            {committeesWithMembers.map((committee, index) => {
                const isBestuur = cleanCommitteeName(committee.name).toLowerCase().includes('bestuur');

                const members = (committee.committee_members || [])
                    ?.filter((member: any) => member.is_visible)
                    .map((member: any) => {
                        const u = member.user_id || {};
                        const first = u.first_name || u.firstname || u.name || '';
                        return {
                            image: getImageUrl(u.avatar),
                            firstName: first || 'Onbekend',
                            isLeader: Boolean(member.is_leader),
                        };
                    }) || [];

                return (
                    <div
                        key={committee.id}
                        className={`${isBestuur ? 'md:col-span-2 lg:col-span-2' : ''} stagger-item`}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <Link
                            href={`/commissies/${slugify(cleanCommitteeName(committee.name))}`}
                            className={`group flex h-full flex-col overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${isBestuur ? 'ring-4 ring-theme-purple/20' : ''
                                }`}
                        >
                            <div className={`relative w-full ${isBestuur ? 'aspect-video' : 'aspect-square'} overflow-hidden bg-gradient-to-br from-theme-purple/5 to-theme-purple/20 dark:from-theme-purple-dark/20 dark:to-theme-purple-dark/40 p-4 shrink-0`}>
                                <CommitteeImage
                                    src={committee.image ? getImageUrl(committee.image) : getDefaultCommitteeImage(committee.id)}
                                    alt={cleanCommitteeName(committee.name)}
                                    committeeId={committee.id}
                                />
                                <div className="absolute inset-0 pointer-events-none" />
                                {isBestuur && (
                                    <div className="absolute right-4 top-4 rounded-full bg-theme-purple-lighter px-3 py-1 text-xs font-bold text-theme-purple-darker shadow-lg">
                                        BESTUUR
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-1 flex-col p-6">
                                <h3 className="mb-2 text-2xl font-bold text-theme">
                                    {cleanCommitteeName(committee.name)}
                                </h3>
                                <p className="mb-4 flex-1 text-sm leading-relaxed text-theme-muted line-clamp-3">
                                    {committee.short_description || 'Geen beschrijving beschikbaar'}
                                </p>

                                {members.length > 0 && (
                                    <div className="flex items-center gap-2 pt-4">
                                        <Users className="h-4 w-4 text-theme-purple" />
                                        <div className="flex -space-x-2">
                                            {members.slice(0, 5).map((member: any, idx: number) => (
                                                <div key={idx} className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-white dark:ring-gray-800">
                                                    <SmartImage
                                                        src={member.image}
                                                        alt={member.firstName}
                                                        fill
                                                        sizes="32px"
                                                        className="object-cover"
                                                        loading="lazy"
                                                        placeholder="blur"
                                                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjZGRkIi8+PC9zdmc+"
                                                    />
                                                </div>
                                            ))}
                                            {members.length > 5 && (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-purple/20 text-xs font-semibold text-theme-purple">
                                                    +{members.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-theme-purple">
                                    Meer lezen
                                    <span className="transition group-hover:translate-x-1">→</span>
                                </div>
                            </div>
                        </Link>
                    </div>
                );
            })}
        </div>
    );
}

export default function CommitteesPage() {
    return (
        <div className="relative z-10 w-full min-h-screen">
            <PageHeader
                title="COMMISSIES"
                backgroundImage="/img/backgrounds/commissies-banner.png"
                backgroundPosition="center 30%"
                imageFilter={`brightness(0.65)`}
            >
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-ink-muted dark:text-white/90 sm:text-xl">
                    Ontdek onze commissies en word deel van het team
                </p>
            </PageHeader>

            <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                <Suspense fallback={<CommitteesSkeleton />}>
                    <CommitteesList />
                </Suspense>
            </main>
        </div>
    );
}
