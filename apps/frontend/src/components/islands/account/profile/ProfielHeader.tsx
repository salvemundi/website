'use client';

import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';
import { Tile } from './ProfielUI';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { getImageUrl } from '@/lib/utils/image-utils';
import { formatDate } from '@/shared/lib/utils/date';

interface Committee {
    id: string | number;
    name: string;
    is_leader: boolean;
}

interface ProfielHeaderProps {
    user: {
        first_name?: string | null;
        last_name?: string | null;
        avatar?: string | null;
        image?: string | null;
        committees?: Committee[];
        membership_expiry?: string | null;
        onAvatarChange?: (file: File) => void;
    };
    membershipStatus: {
        text: string;
        color: string;
        textColor: string;
    };
}

export default function ProfielHeader({ user, membershipStatus }: ProfielHeaderProps) {
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    const [random] = useState(() => (isCommitteeMember ? Math.floor(Math.random() * 500) : -1));

    const displayName = useMemo(() => {
        if (isCommitteeMember && random === 0) {
            return "Vouw een Bak!";
        }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || "Niet ingesteld";
    }, [user.first_name, user.last_name, isCommitteeMember, random]);

    return (
        <Tile className="h-fit">
            <div className="flex flex-col items-center gap-6 text-center">
                <div className="group relative shrink-0">
                    <label
                        className="group relative block cursor-pointer"
                        title="Profielfoto wijzigen"
                    >
                        <div className="relative size-28 overflow-hidden rounded-full border-4 border-purple-100 bg-bg-card shadow-lg transition-transform group-hover:scale-105 sm:size-32">
                            {user.avatar ? (
                                <MediaAsset
                                    asset={getImageUrl(user.avatar, { width: 250, height: 250, fit: 'cover' }) || ''}
                                    alt="avatar"
                                    width={128}
                                    height={128}
                                    className="size-full object-cover"
                                />
                            ) : (
                                <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-linear-to-br from-brand-primary to-brand-secondary">
                                    <span className="text-4xl font-bold text-purple-300">
                                        {user.first_name?.[0] || '?'}
                                    </span>
                                </div>
                            )}

                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                <svg className="mb-1 size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="text-[10px] font-black tracking-wider uppercase">Wijzigen</span>
                            </div>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    user.onAvatarChange?.(file);
                                }
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>

                <div className="w-full min-w-0">
                    <h2 className="text-xl font-extrabold wrap-break-word text-purple-700 sm:text-2xl dark:text-white">
                        {displayName}
                    </h2>

                    <div className="mt-4 flex flex-wrap justify-center">
                        <span className={`px-6 py-2 ${membershipStatus.color} ${membershipStatus.textColor} max-w-full rounded-full text-center text-[11px] font-black tracking-wider wrap-break-word uppercase shadow-md transition-all`}>
                            {membershipStatus.text || 'Gebruiker'}
                        </span>
                    </div>

                    {Array.isArray(user.committees) && user.committees.length > 0 && (
                        <div className="mt-6">
                            <p className="mb-3 text-center text-[10px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                                Mijn Commissies
                            </p>
                            <div className="text-lg font-semibold wrap-break-word">
                                {user.committees.map((committee) => (
                                    <span
                                        key={committee.id}
                                        className="group relative inline-flex max-w-full items-center gap-2 rounded-full border border-licht-paars/20 bg-licht-paars/10 px-4 py-2 text-xs font-bold text-purple-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white"
                                    >
                                        {committee.is_leader && !committee.name.toLowerCase().includes('bestuur') && (
                                            <span className="absolute -top-1 -right-1 flex size-4 shrink-0 items-center justify-center rounded-full border-2 border-bg-card bg-linear-to-br from-yellow-400 to-yellow-600 shadow-md">
                                                <Star className="size-2 shrink-0 fill-current text-white" />
                                            </span>
                                        )}
                                        <span className="truncate">{committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-1.5">
                        <div className="flex h-6 items-center justify-center pl-1">
                            <p className="text-[10px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                                Lidmaatschap tot
                            </p>
                        </div>
                        <div className="squircle flex min-h-14 items-center justify-center border border-licht-paars/20 bg-licht-paars/10 px-5 py-4 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                            <p className="text-base font-bold text-purple-700 dark:text-white">
                                {user.membership_expiry
                                    ? formatDate(user.membership_expiry, "d MMM yyyy")
                                    : "Niet van toepassing"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Tile>
    );
}
