'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { CoboBoardPreference } from '@salvemundi/validations';
import { Wine, Ban, Utensils, ShieldCheck, FileText } from 'lucide-react';
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
        <section className="space-y-8 pt-6 border-t border-border-color/10">
            <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 text-3xl sm:text-4xl font-black text-theme-purple">
                    <ShieldCheck className="h-9 w-9 text-purple-600 dark:text-purple-400 shrink-0" />
                    <h2>Het Bestuur &amp; Voorkeuren</h2>
                </div>
                <div className="h-1.5 w-24 bg-linear-to-r from-transparent via-purple-500 to-transparent rounded-full my-4" />
                <p className="text-sm text-text-muted font-medium max-w-xl">
                    Bekijk per bestuurslid de functie, alcoholvoorkeur en veto&apos;s voordat je gaat recipiëren.
                </p>
            </div>

            <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {boardMembers.map((member) => {
                    const memberName = [member.user?.first_name, member.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';
                    const vetoList = member.vetoes
                        ? member.vetoes.split(/[,;\n]+/).map(v => v.trim()).filter(Boolean)
                        : [];

                    return (
                        <div
                            key={member.user_id || member.id}
                            className="bg-bg-card rounded-3xl p-6 shadow-md border border-border-color flex flex-col justify-between space-y-5"
                        >
                            <div className="space-y-4">
                                <div className="flex flex-col items-center text-center">
                                    <div className="relative mb-4 h-32 w-32 overflow-hidden squircle shadow-md ring-4 ring-bg-soft">
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

                                    <h3 className="font-black text-text-main text-lg">
                                        {memberName}
                                    </h3>
                                    <span className="text-[11px] font-bold text-text-muted bg-bg-soft px-3.5 py-1 rounded-full border border-border-color/10 mt-1.5 shadow-xs">
                                        {member.user?.functie || 'Bestuurslid'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between p-3 rounded-2xl bg-bg-soft border border-border-color/40">
                                    <div className="flex items-center gap-2">
                                        <Wine className={`h-4 w-4 ${member.drinks_alcohol ? 'text-emerald-500' : 'text-slate-400'}`} />
                                        <span className="text-xs font-semibold text-text-main">Alcohol</span>
                                    </div>
                                    {member.drinks_alcohol ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                            Drinkt alcohol
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                            Geen alcohol (0.0%)
                                        </span>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-2">
                                        <Ban className="h-3.5 w-3.5 text-rose-500" />
                                        <span>Veto&apos;s</span>
                                    </div>

                                    {vetoList.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {vetoList.map((veto) => (
                                                <span
                                                    key={veto}
                                                    className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 shadow-xs"
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
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                                            <Utensils className="h-3.5 w-3.5 text-amber-500" />
                                            <span>Allergieën</span>
                                        </div>
                                        <p className="text-xs font-medium text-text-main bg-amber-500/10 p-3 rounded-2xl border border-amber-500/20">
                                            {member.dietary_requirements}
                                        </p>
                                    </div>
                                )}

                                {Boolean(member.notes) && (
                                    <div>
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-text-muted mb-1">
                                            <FileText className="h-3.5 w-3.5 text-blue-500" />
                                            <span>Opmerking</span>
                                        </div>
                                        <p className="text-xs font-medium text-text-main bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20">
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

