export const dynamic = 'force-dynamic';

import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';
import { getFeatureFlagSettings } from '@/server/actions/admin/admin-utils.actions';
import {
    getLatestActiveCoboDb,
    getCoboGuestBoardsDb
} from '@/server/queries/cobo/admin-cobo.queries';
import CoboPublicQueueIsland from '@/components/islands/cobo/CoboPublicQueueIsland';
import { Wine, Calendar } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Wachtlijst | Constitutieborrel (CoBo) | Salve Mundi',
    description: 'Bekijk de volledige wachtlijst voor de Constitutieborrel van Salve Mundi.'
};

export default async function CoboWachtlijstPage() {
    await connection();

    const [featureFlag, activeCobo] = await Promise.all([
        getFeatureFlagSettings('/cobo').catch(() => ({
            show: true,
            disabled_message: null,
            canToggleVisibility: false
        })),
        getLatestActiveCoboDb()
    ]);

    const isEnabled = featureFlag.show;

    if (!isEnabled) {
        return (
            <PublicPageShell
                title="Wachtlijst CoBo"
                description="Wachtlijst van besturen/gasten."
            >
                <div className="mx-auto max-w-4xl px-fluid-md pt-fluid-lg pb-16">
                    <div className="squircle-lg mx-auto max-w-xl border border-border-color bg-bg-card p-8 text-center shadow-lg sm:p-12">
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
                            <Wine className="size-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl font-black text-purple-700 sm:text-2xl dark:text-purple-300">
                            CoBo Gesloten
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed font-medium text-text-muted">
                            {featureFlag.disabled_message || 'De CoBo module is momenteel gesloten.'}
                        </p>
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    if (!activeCobo) {
        return (
            <PublicPageShell
                title="Wachtlijst CoBo"
                description="Wachtlijst van besturen/gasten."
            >
                <div className="mx-auto max-w-4xl px-fluid-md pt-fluid-lg pb-16">
                    <div className="squircle-lg mx-auto max-w-xl border border-border-color bg-bg-card p-8 text-center shadow-lg sm:p-12">
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
                            <Calendar className="size-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl font-black text-purple-700 sm:text-2xl dark:text-purple-300">
                            Geen actieve CoBo gevonden
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed font-medium text-text-muted">
                            Er is momenteel geen actieve Constitutieborrel gepland.
                        </p>
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    const guestBoards = await getCoboGuestBoardsDb(activeCobo.id);

    return (
        <PublicPageShell
            title={`Live Wachtlijst: ${activeCobo.title || 'CoBo'}`}
            description="Realtime live volgorde van feliciterende besturen en verenigingen."
        >
            <div className="mx-auto max-w-4xl space-y-6 px-fluid-md pt-fluid-sm pb-16">
                <div>
                    <BackButton href="/cobo" title="Terug naar CoBo overzicht" />
                </div>

                <CoboPublicQueueIsland
                    coboId={activeCobo.id}
                    initialGuestBoards={guestBoards}
                />
            </div>
        </PublicPageShell>
    );
}
