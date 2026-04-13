'use client';

import React from 'react';
import Image from 'next/image';
import { Users2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tile } from './ProfielUI';
import { getImageUrl } from '@/lib/utils/image-utils';
import { Skeleton } from '../../../ui/Skeleton';

interface ProfielHeaderProps {
    isLoading?: boolean;
    user?: any;
    membershipStatus?: {
        text: string;
        color: string;
        textColor: string;
    };
}

export default function ProfielHeader({ isLoading = false, user = {}, membershipStatus = { text: '', color: '', textColor: '' } }: ProfielHeaderProps) {
    return (
        <Tile className={`h-fit ${isLoading ? 'skeleton-active' : ''}`} aria-busy={isLoading}>
            <div className="flex flex-col gap-6 items-center text-center">
                <div className="relative group shrink-0">
                    <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-[var(--color-purple-100)] shadow-lg bg-white">
                        {!isLoading && (user.avatar || user.image) ? (
                            <Image
                                src={(user.avatar ? getImageUrl(user.avatar) : user.image ? getImageUrl(user.image) : '') as string}
                                alt={user.name || "Avatar"}
                                fill
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            <div className="h-full w-full bg-[var(--color-purple-50)] border border-[var(--color-purple-100)] flex items-center justify-center">
                                <span className="text-4xl font-bold text-[var(--color-purple-300)]">
                                    {isLoading ? '?' : (user.name?.[0] || '?')}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="min-w-0 w-full animate-in fade-in duration-500">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-purple-700)] dark:text-white break-words">
                        {isLoading ? 'User Full Name' : (user.name || "Niet ingesteld")}
                    </h2>

                    <div className="mt-4 flex flex-wrap justify-center">
                        <span className={`px-6 py-2 ${isLoading ? 'bg-slate-200 text-transparent' : `${membershipStatus.color} ${membershipStatus.textColor}`} text-[11px] font-black uppercase tracking-wider rounded-full shadow-md transition-all text-center break-words max-w-full`}>
                            {isLoading ? 'LOADING STATUS' : membershipStatus.text}
                        </span>
                    </div>

                    {(isLoading || (Array.isArray(user.committees) && user.committees.length > 0)) && (
                        <div className="mt-6">
                            <p className="text-[10px] text-[var(--color-purple-400)] font-black uppercase tracking-wider mb-3 text-center">
                                Mijn Commissies
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {(isLoading ? [1, 2] : user.committees).map((committee: any, idx: number) => (
                                    <span
                                        key={isLoading ? idx : (committee.id || (committee.name ?? 'unknown'))}
                                        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-purple-50)] dark:bg-white/10 border border-[var(--color-purple-100)] dark:border-white/20 rounded-full text-xs font-bold text-[var(--color-purple-700)] dark:text-white shadow-sm max-w-full"
                                    >
                                        {!isLoading && committee.is_leader && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-[var(--bg-card)] shadow-md flex items-center justify-center shrink-0">
                                                <span className="text-[8px]">⭐</span>
                                            </span>
                                        )}
                                        <Users2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{isLoading ? 'Committee' : (committee.name ?? '').replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3">
                        <div className="rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 px-5 py-4 shadow-sm">
                            <p className="text-[10px] text-[var(--color-purple-400)] font-black uppercase tracking-wider mb-1.5">
                                Lidmaatschap tot
                            </p>
                            <p className="text-base font-bold text-[var(--color-purple-700)] dark:text-white">
                                {isLoading ? '01 JAN 2024' : (user.membership_expiry 
                                    ? format(new Date(user.membership_expiry), "d MMM yyyy", { locale: nl })
                                    : "Niet van toepassing")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Tile>
    );
}

