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
                    <div className="squircle-lg mx-auto max-w-2xl border border-border-color bg-bg-card p-8 text-center shadow-lg sm:p-12">
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
                title="Constitutieborrel"
                description="Vier de constitutie van het nieuwe bestuur samen met Salve Mundi en zusterverenigingen."
            >
                <div className="mx-auto max-w-7xl px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32">
                    <div className="squircle-lg mx-auto max-w-2xl border border-border-color bg-bg-card p-8 text-center shadow-lg sm:p-12">
                        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
                            <Calendar className="size-8 text-purple-700 dark:text-purple-300" />
                        </div>
                        <h2 className="text-xl font-black text-purple-700 sm:text-2xl dark:text-purple-300">
                            Geen actieve CoBo gevonden
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed font-medium text-text-muted">
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
            <div className="mx-auto max-w-7xl space-y-12 px-fluid-md pt-fluid-lg pb-16 sm:pb-24 lg:pb-32">
                <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                    <div className="space-y-8 lg:col-span-7">
                        <CoboPublicQueueIsland
                            coboId={activeCobo.id}
                            initialGuestBoards={guestBoards}
                            limit={3}
                        />
                    </div>

                    <aside className="space-y-6 lg:col-span-5">
                        <section className="space-y-5 rounded-2xl border border-border-color bg-bg-card p-6 shadow-lg sm:rounded-3xl sm:p-8">
                            <h2 className="flex items-center gap-3 text-xl font-black text-purple-700 sm:text-2xl dark:text-purple-300">
                                Evenement Details
                            </h2>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                                        <Clock className="size-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Datum &amp; Tijd</p>
                                        <p className="text-sm leading-relaxed font-medium text-(--text-main)">
                                            {formattedDate}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                                        <MapPin className="size-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Locatie</p>
                                        <p className="text-sm leading-relaxed font-medium text-(--text-main)">
                                            {activeCobo.location || 'Borrelbar Eindhoven'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3.5">
                                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/10 bg-purple-500/5 text-purple-700 dark:border-purple-400/10 dark:bg-purple-400/5 dark:text-purple-300">
                                        <Mail className="size-5" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-bold tracking-widest text-(--text-muted) uppercase">Contact</p>
                                        <p className="text-sm leading-relaxed font-medium text-(--text-main)">cobo@salvemundi.nl</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* CoBo Etiquette & Regels */}
                        <section className="space-y-4 rounded-2xl border border-border-color bg-bg-card p-6 shadow-lg sm:rounded-3xl sm:p-8">
                            <h2 className="flex items-center gap-3 text-xl font-black text-purple-700 sm:text-2xl dark:text-purple-300">
                                <ScrollText className="size-6 text-purple-600 dark:text-purple-300" />
                                CoBo Etiquette
                            </h2>
                            <div className="space-y-3 text-sm leading-relaxed font-medium text-slate-600 dark:text-slate-400">
                                <p>
                                    Kom je het bestuur feliciteren? Meld je bij binnenkomst aan bij de <strong>pedel</strong> om op de wachtlijst te worden geplaatst.
                                </p>
                                <ul className="list-inside list-disc space-y-1.5 text-xs text-text-muted">
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
