'use client';

import MediaAsset from '@/components/ui/media/MediaAsset';
import { getImageUrl } from '@/lib/utils/image-utils';

interface ProfielHeaderProps {
    user: {
        first_name?: string | null;
        last_name?: string | null;
        avatar?: string | null;
        committees?: {
            id: string | number;
            name: string;
            is_leader: boolean;
        }[];
        onAvatarChange?: (file: File) => void;
    };
    membershipStatus: {
        text: string;
        color: string;
        textColor: string;
    };
}

export default function ProfielHeader({ user, membershipStatus }: ProfielHeaderProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[2.5rem] p-8 border border-[var(--beheer-border)] shadow-sm">
            <div className="flex items-center gap-6">
                <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-[var(--beheer-accent)]/10 flex items-center justify-center overflow-hidden border border-[var(--beheer-border)]">
                        {user.avatar ? (
                            <MediaAsset
                                asset={getImageUrl(user.avatar, { width: 150, height: 150, fit: 'cover' }) || ''}
                                alt="avatar"
                                width={80}
                                height={80}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-[var(--beheer-accent)]">
                                {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                        )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 p-1.5 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-full cursor-pointer hover:bg-[var(--beheer-card-soft)] transition-colors">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files) {
                                    user.onAvatarChange?.(e.target.files[0]);
                                }
                            }}
                        />
                        <span className="sr-only">Avatar wijzigen</span>
                        <div className="h-3 w-3 bg-[var(--beheer-accent)] rounded-full" />
                    </label>
                </div>

                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-[var(--beheer-text)]">
                        {user.first_name} {user.last_name}
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-[10px] font-bold w-fit ${membershipStatus.color} ${membershipStatus.textColor}`}>
                        {membershipStatus.text}
                    </div>
                </div>
            </div>

            {user.committees && user.committees.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-2">
                    {user.committees.map((committee) => (
                        <span
                            key={committee.id}
                            className="px-3 py-1 rounded-lg bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] text-[10px] font-semibold border border-[var(--beheer-border)]"
                        >
                            {committee.name} {committee.is_leader && ' (Leider)'}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}