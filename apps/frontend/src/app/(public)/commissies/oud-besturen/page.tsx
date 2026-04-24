import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BoardHistoryTimeline from '@/components/islands/committees/BoardHistoryTimeline';
import { getBoardHistory } from '@/server/actions/board.actions';
import BackButton from '@/components/ui/navigation/BackButton';
import { History } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Bestuursgeschiedenis | SV Salve Mundi',
    description: 'Ontdek de mensen die Salve Mundi door de jaren heen hebben gevormd en geleid.',
};

export default async function BoardHistoryPage() {
    // NUCLEAR SSR: Fetch all history data before flushing the shell
    const boards = await getBoardHistory();

    return (
        <PublicPageShell
            title="BESTUURSGESCHIEDENIS"
            backgroundImage="/img/backgrounds/commissies-banner.png"
            backgroundPosition="center 30%"
            imageFilter="brightness(0.6) blur(2px)"
            description="Een eregalerij van alle voorgaande besturen van de vereniging"
        >
            <div className="container mx-auto px-4 max-w-7xl pt-8 pb-4">
                <BackButton href="/commissies/bestuur" title="Terug naar Huidig Bestuur" text="Huidig Bestuur" />
            </div>

            <main className="mx-auto max-w-app px-4 pb-32 pt-8">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <div className="p-4 rounded-3xl bg-[var(--color-purple-500)]/10 text-[var(--color-purple-500)] mb-6 shadow-sm ring-1 ring-[var(--color-purple-500)]/20">
                        <History className="h-10 w-10" />
                    </div>
                    <h2 className="text-4xl font-black text-[var(--text-main)] mb-4 tracking-tight">
                        Onze Geschiedenis
                    </h2>
                    <p className="text-[var(--text-muted)] max-w-2xl text-lg font-medium leading-relaxed">
                        Sinds de oprichting van SV Salve Mundi hebben vele gedreven studenten zich ingezet om de vereniging te laten groeien. 
                        Hieronder vind je het overzicht van alle besturen die de basis hebben gelegd voor wat we vandaag zijn.
                    </p>
                    <div className="h-1 w-24 bg-gradient-to-r from-transparent via-[var(--color-purple-500)] to-transparent rounded-full mt-10" />
                </div>

                <BoardHistoryTimeline boards={boards} />
            </main>
        </PublicPageShell>
    );
}
