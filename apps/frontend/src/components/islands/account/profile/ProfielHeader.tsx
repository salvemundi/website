'use client';

import React from 'react';
import Image from 'next/image';
import { Users2 } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Tile } from './ProfielUI';
import { getImageUrl } from '@/lib/utils/image-utils';
import { COMMITTEES } from '@/shared/lib/permissions-config';

interface ProfielHeaderProps {
    user?: any;
    membershipStatus?: {
        text: string;
        color: string;
        textColor: string;
    };
}

export default function ProfielHeader({ user = {}, membershipStatus = { text: '', color: '', textColor: '' } }: ProfielHeaderProps) {
    return (
        <Tile className="h-fit">
            <div className="flex flex-col gap-6 items-center text-center">
                <div className="relative group shrink-0">
                    <label 
                        className="relative block cursor-pointer group"
                        title="Profielfoto wijzigen"
                    >
                        <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-[var(--color-purple-100)] shadow-lg bg-white transition-transform group-hover:scale-105">
                            {user.avatar || user.image ? (
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
                                        {user.name?.[0] || '?'}
                                    </span>
                                </div>
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2">
                                <svg className="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-[10px] font-black uppercase tracking-wider">Wijzigen</span>
                            </div>
                        </div>
                        <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && (user as any).onAvatarChange) {
                                    (user as any).onAvatarChange(file);
                                }
                                // Reset input so same file can be picked again if needed
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>

                <div className="min-w-0 w-full animate-in fade-in duration-500">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-purple-700)] dark:text-white break-words">
                        {user.name || "Niet ingesteld"}
                    </h2>

                    <div className="mt-4 flex flex-wrap justify-center">
                        <span className={`px-6 py-2 ${membershipStatus.color} ${membershipStatus.textColor} text-[11px] font-black uppercase tracking-wider rounded-full shadow-md transition-all text-center break-words max-w-full`}>
                            {membershipStatus.text || 'Gebruiker'}
                        </span>
                    </div>

                    {Array.isArray(user.committees) && user.committees.length > 0 && (
                        <div className="mt-6">
                            <p className="text-[10px] text-[var(--color-purple-400)] font-black uppercase tracking-wider mb-3 text-center">
                                Mijn Commissies
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {user.committees.map((committee: any) => (
                                    <span
                                        key={committee.id || (committee.name ?? 'unknown')}
                                        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-purple-50)] dark:bg-white/10 border border-[var(--color-purple-100)] dark:border-white/20 rounded-full text-xs font-bold text-[var(--color-purple-700)] dark:text-white shadow-sm max-w-full"
                                    >
                                        {committee.is_leader && committee.azure_group_id !== COMMITTEES.BESTUUR && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-[var(--bg-card)] shadow-md flex items-center justify-center shrink-0">
                                                <span className="text-[8px]">⭐</span>
                                            </span>
                                        )}
                                        <Users2 className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{(committee.name ?? '').replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}</span>
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
                                {user.membership_expiry 
                                    ? format(new Date(user.membership_expiry), "d MMM yyyy", { locale: nl })
                                    : "Niet van toepassing"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Tile>
    );
}

