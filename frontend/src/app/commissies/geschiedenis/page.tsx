'use client';

import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { useSalvemundiBoard } from '@/shared/lib/hooks/useSalvemundiApi';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { Users, ArrowLeft } from 'lucide-react';

export default function BoardHistoryPage() {
    const { data: boards = [], isLoading, error } = useSalvemundiBoard();

    

    function getMemberFullName(member: any) {
        // Try nested relation first (legacy naming)
        if (member?.member_id) {
            const m = member.member_id;
            const first = m.first_name || m.firstname || m.name || m.display_name;
            const last = m.last_name || m.lastname || m.surname || '';
            const combined = `${first || ''} ${last || ''}`.trim();
            if (combined) return combined;
        }

        // Direct user relation preferred (current payload uses `user_id`)
        if (member?.user_id) {
            const u = member.user_id;
            const first = u.first_name || u.firstname || u.name || u.display_name || u.given_name;
            const last = u.last_name || u.lastname || u.surname || u.family_name || '';
            const combined = `${first || ''} ${last || ''}`.trim();
            if (combined) return combined;
        }

        // Try direct fields on the member object
        const firstDirect = member.first_name || member.firstname || member.given_name;
        const lastDirect = member.last_name || member.lastname || member.family_name;
        if (firstDirect || lastDirect) return `${firstDirect || ''} ${lastDirect || ''}`.trim();

        // Try alternative names
        if (member.name) return member.name;
        if (member.full_name) return member.full_name;

        return 'Onbekend';
    }

    return (
        <>
            <div className="relative z-10">
                <PageHeader
                    title="BESTUURSGESCHIEDENIS"
                    backgroundImage="/img/backgrounds/commissies-banner.jpg"
                >
                    <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-ink-muted dark:text-white/90 sm:text-xl">
                        Ontdek alle eerdere besturen van Salve Mundi
                    </p>
                </PageHeader>

                <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
                    <Link
                        href="/commissies/bestuur"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-paars transition hover:text-paars/80"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Terug naar huidig bestuur
                    </Link>

                    {isLoading ? (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div key={i} className="h-96 animate-pulse rounded-3xl bg-white/60" />
                            ))}
                        </div>
                    ) : error ? (
                        <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
                            <p className="mb-2 text-lg font-semibold text-paars">Fout bij laden van bestuursgeschiedenis</p>
                            <p className="text-sm text-slate-600">{String(error)}</p>
                        </div>
                    ) : boards.length === 0 ? (
                        <div className="rounded-3xl bg-white/80 p-8 text-center shadow-lg">
                            <p className="text-lg text-slate-600">Geen bestuursgeschiedenis gevonden</p>
                        </div>
                    ) : (
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {boards.map((board) => {
                                const boardMembers = board.members || [];
                                
                                return (
                                    <div
                                        key={board.id}
                                        className="overflow-hidden rounded-3xl bg-white/90 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
                                    >
                                        {/* Board Image */}
                                        <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-paars/20 to-oranje/20">
                                            {board.image ? (
                                                <img
                                                    src={getImageUrl(board.image)}
                                                    alt={board.naam}
                                                    className="h-full w-full object-cover transition duration-700 hover:scale-105"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = '/img/group-jump.gif';
                                                    }}
                                                />
                                            ) : (
                                                <img
                                                    src="/img/group-jump.gif"
                                                    alt={board.naam}
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 pointer-events-none" />
                                            {/* Year badge */}
                                            {board.year && (
                                                <div className="absolute left-4 top-4 rounded-full bg-paars text-beige px-3 py-1 text-sm font-bold">
                                                    {board.year}
                                                </div>
                                            )}
                                        </div>

                                        {/* Board Info */}
                                        <div className="p-6">
                                            <h3 className="mb-4 text-2xl font-bold text-slate-900">
                                                {board.naam}
                                            </h3>

                                            {/* Board Members */}
                                            {boardMembers.length > 0 && (
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-2 text-sm font-semibold text-paars">
                                                        <Users className="h-4 w-4" />
                                                        <span>{boardMembers.length} bestuursleden</span>
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        {boardMembers.map((member: any) => (
                                                            <div
                                                                key={member.id}
                                                                className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                                                            >
                                                                <img
                                                                    src={
                                                                        member.member_id?.picture
                                                                            ? getImageUrl(member.member_id.picture)
                                                                            : '/img/placeholder.svg'
                                                                    }
                                                                    alt={`${member.member_id?.first_name || ''} ${member.member_id?.last_name || ''}`}
                                                                    className="h-12 w-12 rounded-full object-cover"
                                                                    onError={(e) => {
                                                                        const target = e.target as HTMLImageElement;
                                                                        target.src = '/img/placeholder.svg';
                                                                    }}
                                                                />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="font-semibold text-slate-900 truncate">
                                                                        {getMemberFullName(member)}
                                                                    </p>
                                                                    {member.functie && (
                                                                        <p className="text-sm text-paars truncate">
                                                                            {member.functie}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
