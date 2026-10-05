import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BoardHistoryTimeline from '@/components/ui/commissies/BoardHistoryTimeline';
import { getBoardHistory } from '@/server/actions/beheer/beheer-board.actions';
import BackButton from '@/components/ui/navigation/BackButton';
import { History } from 'lucide-react';
import { connection } from 'next/server';

export const metadata: Metadata = {
    title: 'Bestuursgeschiedenis | Salve Mundi',
    description: 'Ontdek de mensen die Salve Mundi door de jaren heen hebben gevormd en geleid.'
};

export default async function BoardHistoryPage() {
    await connection();

    const boards = await getBoardHistory();

    return (
        <PublicPageShell>
            <div className="container max-w-7xl px-fluid-md pt-fluid-md pb-4">
                <BackButton href="/commissies/bestuur" title="Terug naar Huidig Bestuur" text="Huidig Bestuur" />
            </div>

            <main className="mx-auto max-w-app px-fluid-md pt-fluid-md pb-fluid-lg">
                <div className="mb-12 flex flex-col items-center text-center sm:mb-16">
                    <div className="mb-6 flex size-16 items-center justify-center rounded-2xl border border-theme-purple/20 bg-theme-purple/10 text-theme-purple shadow-sm">
                        <History className="size-8" />
                    </div>
                    <h1 className="mb-4 text-3xl font-black tracking-tight text-theme-purple sm:text-4xl">
                        Onze Geschiedenis
                    </h1>
                    <p className="max-w-2xl text-base leading-relaxed font-medium text-(--text-muted) sm:text-lg">
                        Sinds de oprichting van Salve Mundi hebben vele gedreven studenten zich ingezet om de vereniging te laten groeien.
                        Hieronder vind je het overzicht van alle besturen die de basis hebben gelegd voor wat we vandaag zijn.
                    </p>
                    <div className="mt-10 h-1 w-24 rounded-full bg-linear-to-r from-transparent via-theme-purple to-transparent" />
                </div>

                <BoardHistoryTimeline boards={boards} />
            </main>
        </PublicPageShell>
    );
}
