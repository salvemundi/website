import React from 'react';
import NextLink from 'next/link';
import { Users, ChevronRight, History } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { slugify } from '@/shared/lib/utils/slug';
import type { Committee } from '@salvemundi/validations';
import Image from 'next/image';

interface CommitteeCardProps {
    committee: Committee;
}

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

// Helper function for default images
function getDefaultCommitteeImage(id: number): string {
    return id % 2 === 0 ? '/img/group-jump.gif' : '/img/groupgif.gif';
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ committee }) => {
    const cleanedName = cleanCommitteeName(committee.name);
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');
    const slug = slugify(cleanedName);
    
    const members = committee.members
        ?.filter(m => m.is_visible && m.user_id?.avatar)
        .map(m => ({
            avatar: getImageUrl(m.user_id!.avatar!),
            name: m.user_id!.first_name || '',
            isLeader: m.is_leader
        })) || [];

    return (
        <div className={`${isBestuur ? 'md:col-span-2' : ''}`}>
            <div className={`group flex h-full flex-col overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${
                isBestuur ? 'ring-4 ring-[var(--color-purple-500)]/20' : ''
            }`}>
                {/* Image Header */}
                <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[var(--color-purple-500)]/20 to-[var(--color-purple-900)]/20">
                    <Image src={getImageUrl(committee.image) ?? '/img/placeholder.svg'} alt={committee.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    {isBestuur && (
                        <div className="absolute right-4 top-4 rounded-full bg-[var(--color-purple-100)] px-3 py-1 text-xs font-bold text-[var(--color-purple-700)] shadow-lg uppercase tracking-wider">
                            Huidig Bestuur
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-2 text-2xl font-bold text-[var(--text-main)] transition-colors group-hover:text-[var(--color-purple-500)]">
                        {cleanedName}
                    </h3>
                    <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-muted)] line-clamp-3">
                        {committee.short_description || 'Geen beschrijving beschikbaar.'}
                    </p>

                    {/* Members stack */}
                    {members.length > 0 && (
                        <div className="flex items-center gap-3 py-4 border-t border-[var(--color-purple-500)]/10">
                            <Users className="h-4 w-4 text-[var(--color-purple-500)]" />
                            <div className="flex -space-x-2">
                                {members.slice(0, 5).map((member, idx) => (
                                    <div key={idx} className="relative h-8 w-8 rounded-full overflow-hidden ring-2 ring-[var(--bg-card)]">
                                        <Image
                                            src={member.avatar ?? '/img/placeholder.svg'}
                                            alt={member.name}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </div>
                                ))}
                                {members.length > 5 && (
                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-purple-500)]/10 text-[var(--color-purple-500)] text-xs font-bold ring-2 ring-[var(--bg-card)]">
                                        +{members.length - 5}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <NextLink 
                            href={`/vereniging/commissies/${slug}`}
                            className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-purple-500)] group/link"
                        >
                            Meer lezen
                            <ChevronRight className="h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                        </NextLink>

                        {isBestuur && (
                            <NextLink
                                href="/vereniging/oud-besturen"
                                className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-purple-50)] dark:bg-[var(--color-purple-900)]/20 px-4 py-2 text-xs font-bold text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)] transition-colors hover:bg-[var(--color-purple-100)]"
                            >
                                <History className="h-3.5 w-3.5" />
                                Hall of Fame
                            </NextLink>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
