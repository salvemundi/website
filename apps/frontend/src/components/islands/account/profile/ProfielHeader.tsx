'use client';

import { useMemo } from 'react';
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
    const displayName = useMemo(() => {
        const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;

        if (isCommitteeMember) {
            const random = Math.floor(Math.random() * 500);
            if (random === 0) {
                return "Vouw een Bak!";
            }
        }

        const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        return fullName || "Niet ingesteld";
    }, [user.first_name, user.last_name, user.committees]);

    return (
        <Tile className="h-fit">
            <div className="flex flex-col gap-6 items-center text-center">
                <div className="relative group shrink-0">
                    <label
                        className="relative block cursor-pointer group"
                        title="Profielfoto wijzigen"
                    >
                        <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-purple-100 shadow-lg bg-bg-card transition-transform group-hover:scale-105">
                            {user.avatar ? (
                                <MediaAsset
                                    asset={getImageUrl(user.avatar, { width: 250, height: 250, fit: 'cover' }) || ''}
                                    alt="avatar"
                                    width={128}
                                    height={128}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full bg-purple-50 border border-purple-100 flex items-center justify-center">
                                    <span className="text-4xl font-bold text-purple-300">
                                        {user.first_name?.[0] || '?'}
                                    </span>
                                </div>
                            )}

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
                                if (file) {
                                    user.onAvatarChange?.(file);
                                }
                                e.target.value = '';
                            }}
                        />
                    </label>
                </div>

                <div className="min-w-0 w-full">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-purple-700 dark:text-white break-words">
                        {displayName}
                    </h2>

                    <div className="mt-4 flex flex-wrap justify-center">
                        <span className={`px-6 py-2 ${membershipStatus.color} ${membershipStatus.textColor} text-[11px] font-black uppercase tracking-wider rounded-full shadow-md transition-all text-center break-words max-w-full`}>
                            {membershipStatus.text || 'Gebruiker'}
                        </span>
                    </div>

                    {Array.isArray(user.committees) && user.committees.length > 0 && (
                        <div className="mt-6">
                            <p className="text-[10px] text-licht-paars dark:text-geel font-black uppercase tracking-wider mb-3 text-center">
                                Mijn Commissies
                            </p>
                            <div className="flex flex-wrap gap-2 justify-center">
                                {user.committees.map((committee) => (
                                    <span
                                        key={committee.id}
                                        className="group relative inline-flex items-center gap-2 px-4 py-2 bg-licht-paars/10 dark:bg-white/5 border border-licht-paars/20 dark:border-white/10 rounded-full text-xs font-bold text-purple-700 dark:text-white shadow-sm max-w-full"
                                    >
                                        {committee.is_leader && !committee.name.toLowerCase().includes('bestuur') && (
                                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-bg-card shadow-md flex items-center justify-center shrink-0">
                                                <Star className="h-2 w-2 text-white fill-current shrink-0" />
                                            </span>
                                        )}
                                        <span className="truncate">{committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex flex-col gap-1.5">
                        <div className="flex items-center justify-center h-6 pl-1">
                            <p className="text-[10px] text-licht-paars dark:text-geel font-black uppercase tracking-wider">
                                Lidmaatschap tot
                            </p>
                        </div>
                        <div className="squircle bg-licht-paars/10 dark:bg-white/5 border border-licht-paars/20 dark:border-white/10 px-5 py-4 shadow-sm text-center flex justify-center items-center min-h-[56px]">
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