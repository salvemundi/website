'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CoboBoardPreference } from '@salvemundi/validations';
import { Wine } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface Props {
    boardMembers: CoboBoardPreference[];
    coboId?: number;
}

interface LiveApiResponse {
    success: boolean;
    boardMembers?: CoboBoardPreference[];
}

export default function CoboBoardMembersGrid({ boardMembers: initialMembers, coboId }: Props) {
    const [boardMembers, setBoardMembers] = useState<CoboBoardPreference[]>(initialMembers);

    useEffect(() => {
        setBoardMembers(initialMembers);
    }, [initialMembers]);

    useEffect(() => {
        if (!coboId) return;

        const fetchLivePreferences = async () => {
            try {
                const res = await fetch(`/api/cobo/live?coboId=${coboId}&includeMembers=true`, {
                    cache: 'no-store'
                });
                if (res.ok) {
                    const data = (await res.json()) as LiveApiResponse;
                    if (data.success && Array.isArray(data.boardMembers)) {
                        setBoardMembers(data.boardMembers);
                    }
                }
            } catch {
            }
        };

        const interval = setInterval(() => {
            void fetchLivePreferences();
        }, 5000);
        return () => clearInterval(interval);
    }, [coboId]);

    if (boardMembers.length === 0) {
        return null;
    }

    return (
        <section className="space-y-8 border-t border-border-color/10 pt-6">
            <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 text-3xl font-black text-theme-purple sm:text-4xl">
                    <h2>Het Bestuur &amp; Voorkeuren</h2>
                </div>
                <div className="my-4 h-1.5 w-24 rounded-full bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                <p className="max-w-xl text-sm font-medium text-text-muted">
                    Bekijk per bestuurslid de functie, alcoholvoorkeur en veto&apos;s voordat je gaat recipiëren.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {boardMembers.map((member) => {
                    const memberName = [member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';
                    const vetoList = member.vetoes
                        ? member.vetoes.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean)
                        : [];

                    return (
                        <div
                            key={member.user_id || member.id}
                            className="flex flex-col justify-between space-y-5 rounded-3xl border border-border-color bg-bg-card p-6 shadow-md"
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col items-center text-center">
                                    <div className="squircle relative mb-4 size-32 overflow-hidden shadow-md ring-4 ring-bg-soft">
                                        {member.user?.avatar ? (
                                            <Image
                                                src={getImageUrl(member.user.avatar)}
                                                alt={memberName}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <FallbackLogo className="object-contain p-4 opacity-45" />
                                        )}
                                    </div>

                                    <h3 className="text-lg font-black text-text-main">
                                        {memberName}
                                    </h3>
                                    <span className="mt-1.5 rounded-full border border-border-color/10 bg-bg-soft px-3.5 py-1 text-[11px] font-bold text-text-muted shadow-xs">
                                        {member.user?.functie || 'Bestuurslid'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-2xl border border-border-color/40 bg-bg-soft p-3">
                                    <div className="flex items-center gap-2">
                                        <Wine className={`size-4 ${member.drinks_alcohol ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="text-xs font-semibold text-text-main">Alcohol</span>
                                    </div>
                                    {member.drinks_alcohol ? (
                                        <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            Drinkt alcohol
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center rounded-full border border-rose-500/20 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                            Geen alcohol (0.0%)
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                        <span>Veto&apos;s</span>
                                    </div>

                                    {vetoList.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {vetoList.map((veto) => (
                                                <span
                                                    key={veto}
                                                    className="inline-flex items-center rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1 text-xs font-bold text-rose-700 shadow-xs dark:text-rose-300"
                                                >
                                                    {veto}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-text-muted italic">
                                            Geen specifieke veto&apos;s opgegeven.
                                        </p>
                                    )}
                                </div>

                                {Boolean(member.dietary_requirements) && (
                                    <div>
                                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                            <span>Allergieën</span>
                                        </div>
                                        <p className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs font-medium text-text-main">
                                            {member.dietary_requirements}
                                        </p>
                                    </div>
                                )}

                                {Boolean(member.notes) && (
                                    <div>
                                        <div className="mb-1 flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-text-muted uppercase">
                                            <span>Opmerking</span>
                                        </div>
                                        <p className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs font-medium text-text-main">
                                            {member.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

