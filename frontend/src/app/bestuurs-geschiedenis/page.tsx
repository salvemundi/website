'use client';

import Link from 'next/link';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import { useSalvemundiBoard } from '@/shared/lib/hooks/useSalvemundiApi';
import { getImageUrl } from '@/shared/lib/api/salvemundi';
import { ArrowLeft } from 'lucide-react';
import Timeline from '@/components/timeline/Timeline';

export default function BoardHistoryPage() {
    const { data: boards = [], isLoading, error } = useSalvemundiBoard();

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
                        <Timeline boards={boards} getImageUrl={getImageUrl} getMemberFullName={(m: any) => `${m.member_id?.first_name ?? m.user_id?.first_name ?? ''} ${m.member_id?.last_name ?? m.user_id?.last_name ?? ''}`.trim() || 'Onbekend'} />
                    )}
                </main>
            </div>
        </>
    );
}
