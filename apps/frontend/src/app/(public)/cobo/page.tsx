export const dynamic = 'force-dynamic';

import { connection } from 'next/server';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getFeatureFlagSettings } from '@/server/actions/admin/admin-utils.actions';
import {
    getLatestActiveCoboDb,
    getActiveBoardMembersDb,
    getCoboGuestBoardsDb
} from '@/server/queries/cobo/admin-cobo.queries';
import CoboPublicQueueIsland from '@/components/islands/cobo/CoboPublicQueueIsland';
import CoboBoardMembersGrid from '@/components/islands/cobo/CoboBoardMembersGrid';
import { Wine, Calendar, Clock, MapPin, Mail, ScrollText } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils/date';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Constitutieborrel (CoBo) | Salve Mundi',
    description: 'Bekijk de live wachtrij, bestuursvoorkeuren en informatie voor de Constitutieborrel (CoBo) van Salve Mundi.'
};

export default async function CoboPage() {
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
                title="Constitutieborrel"
                description="Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen."
            >
                <div className="mx-auto max-w-7xl px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32">
                    <div className="bg-bg-card p-8 sm:p-12 squircle-lg text-center shadow-lg max-w-2xl mx-auto border border-border-color">
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
                title="Constitutieborrel"
                description="Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen."
            >
                <div className="mx-auto max-w-7xl px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32">
                    <div className="bg-bg-card p-8 sm:p-12 squircle-lg text-center shadow-lg max-w-2xl mx-auto border border-border-color">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-purple-500/20">
                            <Calendar className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300">
                            Geen actieve CoBo gevonden
                        </h2>
                        <p className="text-text-muted mt-2 text-sm font-medium leading-relaxed">
                            Er is momenteel geen actieve Constitutieborrel gepland. Houd de agenda in de gaten!
                        </p>
                    </div>
                </div>
            </PublicPageShell>
        );
    }

    const [boardMembers, guestBoards] = await Promise.all([
        getActiveBoardMembersDb(activeCobo.id),
        getCoboGuestBoardsDb(activeCobo.id)
    ]);

    const formattedDate = activeCobo.date ? formatDate(activeCobo.date, 'd MMMM yyyy HH:mm') : 'Datum volgt';

    return (
        <PublicPageShell
            title={activeCobo.title || 'Constitutieborrel'}
            description={activeCobo.description || 'Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen.'}
        >
            <div className="mx-auto max-w-7xl px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32 space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-8">
                        <CoboPublicQueueIsland
                            coboId={activeCobo.id}
                            initialGuestBoards={guestBoards}
                            limit={3}
                        />
                    </div>

                    <aside className="lg:col-span-5 space-y-6">
                        <section className="bg-bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-border-color space-y-5">
                            <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 flex items-center gap-3">
                                Evenement Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex gap-3.5 items-center">
                                    <div className="h-10 w-10 rounded-xl bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 dark:border-purple-400/10">
                                        <Clock className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Datum &amp; Tijd</p>
                                        <p className="text-sm text-(--text-main) font-medium leading-relaxed">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3.5 items-center">
                                    <div className="h-10 w-10 rounded-xl bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 dark:border-purple-400/10">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Locatie</p>
                                        <p className="text-sm text-(--text-main) font-medium leading-relaxed">
                                            {activeCobo.location || 'Borrelbar Eindhoven'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-3.5 items-center">
                                    <div className="h-10 w-10 rounded-xl bg-purple-500/5 dark:bg-purple-400/5 text-purple-700 dark:text-purple-300 flex items-center justify-center shrink-0 border border-purple-500/10 dark:border-purple-400/10">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Contact</p>
                                        <p className="text-sm text-(--text-main) font-medium leading-relaxed">cobo@salvemundi.nl</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CoBo Etiquette & Regels */}
                        <section className="bg-bg-card rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border border-border-color space-y-4">
                            <h2 className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-300 flex items-center gap-3">
                                <ScrollText className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                                CoBo Etiquette
                            </h2>
                            <div className="text-slate-600 dark:text-slate-400 leading-relaxed space-y-3 text-sm font-medium">
                                <p>
                                    Kom je het bestuur feliciteren? Meld je bij binnenkomst aan bij de <strong>pedel</strong> om op de wachtlijst te worden geplaatst.
                                </p>
                                <ul className="list-disc list-inside space-y-1.5 text-xs text-text-muted">
                                    <li>Zorg dat je klaarstaat wanneer je bestuur bijna aan de beurt is.</li>
                                    <li>Houd rekening met de alcohol- en veto-wensen van de bestuursleden hieronder.</li>
                                    <li>Geniet van een gezellige avond samen met Salve Mundi!</li>
                                </ul>
                            </div>
                        </section>
                    </aside>
                </div>

                <CoboBoardMembersGrid
                    boardMembers={boardMembers}
                    coboId={activeCobo.id}
                />
            </div>
        </PublicPageShell>
    );
}
