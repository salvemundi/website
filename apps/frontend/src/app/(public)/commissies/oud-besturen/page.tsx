import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BoardHistoryTimeline from '@/components/ui/commissies/BoardHistoryTimeline';
import { getBoardHistory } from '@/server/actions/admin/admin-board.actions';
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
            <div className="container px-fluid-md max-w-7xl pt-fluid-md pb-4">
                <BackButton href="/commissies/bestuur" title="Terug naar Huidig Bestuur" text="Huidig Bestuur" />
            </div>

            <main className="mx-auto max-w-app px-fluid-md pb-fluid-lg pt-fluid-md">
                {/* Header Section */}
                <div className="flex flex-col items-center mb-16 text-center">
                    <div className="p-4 rounded-3xl bg-purple-500/10 text-purple-500 mb-6 shadow-sm ring-1 ring-purple-500/20">
                        <History className="h-10 w-10" />
                    </div>
                    <h2 className="text-4xl font-black text-theme-purple mb-4 tracking-tight">
                        Onze Geschiedenis
                    </h2>
                    <p className="text-text-muted max-w-2xl text-lg font-medium leading-relaxed">
                        Sinds de oprichting van Salve Mundi hebben vele gedreven studenten zich ingezet om de vereniging te laten groeien.
                        Hieronder vind je het overzicht van alle besturen die de basis hebben gelegd voor wat we vandaag zijn.
                    </p>
                    <div className="h-1 w-24 bg-linear-to-r from-transparent via-purple-500 to-transparent rounded-full mt-10" />
                </div>

                <BoardHistoryTimeline boards={boards} />
            </main>
        </PublicPageShell>
    );
}
