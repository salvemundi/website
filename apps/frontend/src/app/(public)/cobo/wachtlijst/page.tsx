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
                    <div className="bg-bg-card p-8 sm:p-12 squircle-lg text-center shadow-lg max-w-xl mx-auto border border-border-color">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                            <Wine className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300">
                            CoBo Gesloten
                        </h2>
                        <p className="text-text-muted mt-2 text-sm font-medium leading-relaxed">
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
                    <div className="bg-bg-card p-8 sm:p-12 squircle-lg text-center shadow-lg max-w-xl mx-auto border border-border-color">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                            <Calendar className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300">
                            Geen actieve CoBo gevonden
                        </h2>
                        <p className="text-text-muted mt-2 text-sm font-medium leading-relaxed">
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
            <div className="mx-auto max-w-4xl px-fluid-md pt-fluid-sm pb-16 space-y-6">
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
