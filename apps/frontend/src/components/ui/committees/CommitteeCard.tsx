import React from 'react';
import NextLink from 'next/link';
import { Users, History } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { slugify } from '@/shared/lib/utils/slug';
import type { Committee } from '@salvemundi/validations/schema/committees.zod';
import Image from 'next/image';

interface CommitteeCardProps {
    committee?: Committee;
    index?: number;
}

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

/**
 * CommitteeCard: Zero-Skeleton SSR standard.
 */
export const CommitteeCard: React.FC<CommitteeCardProps> = ({ 
    committee = {} as Committee,
    index = 0
}) => {
    const cleanedName = cleanCommitteeName(committee.name || '');
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');
    const slug = slugify(cleanedName);
    
    const members = committee.members
        ?.filter(m => m.is_visible && m.user_id?.avatar)
        .map(m => ({
            avatar: getImageUrl(m.user_id!.avatar!),
            name: m.user_id!.first_name || '',
            isLeader: m.is_leader
        })) || [];

    const hasHistory = (committee as any).has_history ?? false;
    const hasImage = !!committee.image;
    const imageUrl = getImageUrl(committee.image);

    return (
        <div className={`${isBestuur ? 'md:col-span-2' : ''}`}>
            <NextLink
                href={`/commissies/${slug}`}
                className={`group flex h-full flex-col overflow-hidden rounded-[2rem] bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl 
                    ${isBestuur ? 'ring-4 ring-[var(--color-purple-500)]/20 shadow-purple-500/10' : ''}`}
            >
                {/* Image Header */}
                <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[var(--color-purple-500)]/20 to-[var(--color-purple-900)]/40">
                    <Image 
                        src={imageUrl} 
                        alt={committee.name || 'Committee'} 
                        fill 
                        className={`transition-all duration-700 ${hasImage ? 'object-cover group-hover:scale-110' : 'object-contain p-12 opacity-40 group-hover:scale-105'}`}
                        unoptimized
                        priority={index < 4}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    
                    {isBestuur && (
                        <div className="absolute right-4 top-4 rounded-full bg-[var(--color-purple-100)] px-3 py-1 text-xs font-bold text-[var(--color-purple-700)] shadow-lg uppercase tracking-wider">
                            Huidig Bestuur
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl md:text-2xl lg:text-xl xl:text-2xl font-black tracking-tight text-[var(--text-main)] group-hover:text-[var(--color-purple-500)] transition-colors break-words hyphens-auto">
                                {cleanedName || 'Commissie'}
                            </h3>
                            
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex -space-x-2">
                                    {members.slice(0, 3).map((member, i) => (
                                        <div key={i} className="relative h-6 w-6 rounded-full border-2 border-[var(--bg-card)] overflow-hidden bg-slate-200 dark:bg-slate-800">
                                            <Image src={member.avatar} alt="Member" fill className="object-cover" unoptimized />
                                        </div>
                                    ))}
                                </div>
                                <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                    <Users className="h-3 w-3" />
                                    {(committee.members?.length || 0)} Leden
                                </span>
                            </div>
                        </div>
                    </div>

                    <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
                        {committee.short_description || `Maak kennis met de ${cleanedName} van SV Salve Mundi.`}
                    </p>

                    {/* Footer Actions */}
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-[var(--border-color)]/20">
                        <span className="text-sm font-black uppercase tracking-widest text-[var(--color-purple-500)] decoration-2 underline-offset-4 group-hover:underline">
                            Meer informatie
                        </span>

                        {hasHistory && !isBestuur && (
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--text-muted)] transition" title="Historie">
                                <History className="h-5 w-5" />
                            </div>
                        )}
                    </div>
                </div>
            </NextLink>
        </div>
    );
};
