'use client';

import Link from 'next/link';
import { Pizza, Trophy, History, ChevronRight } from 'lucide-react';
import type { PizzaStats } from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { formatDate } from '@/shared/lib/utils/date';
import { formatEuro } from './pizza-utils';

function StatTile({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="squircle border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <p className="text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-70">{label}</p>
            <p className="mt-1 text-2xl font-black text-purple-700 dark:text-white">{value}</p>
        </div>
    );
}

export function PizzaStatsIsland({ stats }: { stats: PizzaStats | null }) {
    if (!stats || (stats.totalOrders === 0 && stats.roundsCreated === 0)) {
        return (
            <div className="squircle-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-inner dark:border-white/10 dark:bg-black/10">
                <p className="text-sm font-bold text-(--text-muted)">Je hebt nog geen pizza&apos;s besteld. Doe mee met een ronde!</p>
                <Link href="/pizza" className="mt-4 form-button inline-flex">
                    <Pizza className="size-4" />
                    Naar de rondes
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatTile label="Totaal bestellingen" value={stats.totalOrders} />
                <StatTile label="Totaal besteed" value={formatEuro(stats.totalSpent)} />
                <StatTile label="Rondes gestart" value={stats.roundsCreated} />
                <StatTile label="Rondes meebesteld" value={stats.roundsJoined} />
            </div>

            <Tile title="Jouw meest bestelde pizza's" icon={<Trophy className="size-6" />}>
                {stats.topPizzas.length === 0 ? (
                    <p className="text-sm text-(--text-muted)">Nog geen bestellingen.</p>
                ) : (
                    <ol className="space-y-2">
                        {stats.topPizzas.slice(0, 5).map((p, i) => (
                            <li key={p.itemName} className="flex items-center justify-between gap-3 rounded-xl bg-(--bg-soft) p-3 text-sm">
                                <span className="font-bold text-(--text-main)">
                                    <span className="mr-2 text-purple-500">{i + 1}.</span>
                                    {p.itemName}
                                </span>
                                <span className="font-black text-purple-700 dark:text-white">{p.count}×</span>
                            </li>
                        ))}
                    </ol>
                )}
            </Tile>

            <Tile title="Recente bestellingen" icon={<History className="size-6" />}>
                {stats.recent.length === 0 ? (
                    <p className="text-sm text-(--text-muted)">Nog geen bestellingen.</p>
                ) : (
                    <ul className="space-y-2">
                        {stats.recent.map((r) => (
                            <li key={`${r.roundId}-${r.orderedAt}-${r.itemName}`}>
                                <Link
                                    href={`/pizza/${r.roundId}`}
                                    className="group flex items-center gap-3 rounded-xl bg-(--bg-soft) p-3 text-sm transition-all hover:bg-licht-paars/10"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-black text-purple-700 dark:text-white">
                                            {r.itemName}{r.size ? ` (${r.size})` : ''}
                                        </p>
                                        <p className="truncate text-xs text-(--text-muted)">
                                            {r.title} · {formatDate(r.orderedAt, 'd MMMM yyyy')}
                                        </p>
                                    </div>
                                    <span className="font-black whitespace-nowrap text-(--text-main)">{formatEuro(r.price)}</span>
                                    <ChevronRight className="size-4 shrink-0 text-purple-700 transition-all group-hover:translate-x-1 dark:text-purple-300" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                )}
            </Tile>
        </div>
    );
}
