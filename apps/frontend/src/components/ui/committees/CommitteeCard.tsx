import React from 'react';
import NextLink from 'next/link';
import { Users, ChevronRight, History } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { slugify } from '@/shared/lib/utils/slug';
import type { Committee } from '@salvemundi/validations';
import Image from 'next/image';
import { Skeleton } from '../Skeleton';

interface CommitteeCardProps {
    isLoading?: boolean;
    committee?: Committee;
}

// Helper function to clean committee names
function cleanCommitteeName(name: string): string {
    return name?.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

export const CommitteeCard: React.FC<CommitteeCardProps> = ({ isLoading = false, committee = {} as Committee }) => {
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

    // Safe check for history (Directus specific field)
    const hasHistory = (committee as any).has_history ?? false;

    return (
        <div className={`${isBestuur ? 'md:col-span-2' : ''}`}>
            <div className={`group flex h-full flex-col overflow-hidden rounded-[2rem] bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl ${
                isBestuur ? 'ring-4 ring-[var(--color-purple-500)]/20' : ''
            }`} aria-busy={isLoading}>
                {/* Image Header */}
                <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-[var(--color-purple-500)]/10 to-[var(--color-purple-900)]/10">
                    {isLoading ? (
                        <Skeleton className="h-full w-full" rounded="none" />
                    ) : (
                        <>
                            <Image 
                                src={getImageUrl(committee.image) ?? '/img/placeholder.svg'} 
                                alt={committee.name} 
                                fill 
                                className="object-cover"
                                unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                            
                            {isBestuur && (
                                <div className="absolute right-4 top-4 rounded-full bg-[var(--color-purple-100)] px-3 py-1 text-xs font-bold text-[var(--color-purple-700)] shadow-lg uppercase tracking-wider">
                                    Huidig Bestuur
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex-1">
                            {isLoading ? (
                                <Skeleton className="h-9 w-48 mb-2" rounded="lg" />
                            ) : (
                                <h3 className="text-2xl font-black tracking-tight text-[var(--text-main)] group-hover:text-[var(--color-purple-500)] transition-colors">
                                    {cleanedName}
                                </h3>
                            )}
                            
                            <div className="flex items-center gap-2 mt-1">
                                {isLoading ? (
                                    <Skeleton className="h-4 w-24" rounded="full" />
                                ) : (
                                    <>
                                        <div className="flex -space-x-2">
                                            {members.slice(0, 3).map((m, i) => (
                                                <div key={i} className="relative h-6 w-6 rounded-full border-2 border-[var(--bg-card)] overflow-hidden">
                                                    <Image src={m.avatar} alt={m.name} fill className="object-cover" unoptimized />
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-1.5 ml-1">
                                            <Users className="h-3 w-3" />
                                            {committee.members?.length || 0} Leden
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {!isLoading && (
                            <NextLink 
                                href={`/commissies/${slug}`}
                                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)] text-[var(--color-purple-500)] transition group-hover:bg-[var(--color-purple-500)] group-hover:text-white"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </NextLink>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="space-y-2 mb-8">
                            <Skeleton className="h-4 w-full" rounded="full" />
                            <Skeleton className="h-4 w-full" rounded="full" />
                            <Skeleton className="h-4 w-3/4" rounded="full" />
                        </div>
                    ) : (
                        <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-[var(--text-muted)]">
                            {committee.short_description || `Maak kennis met de ${cleanedName} van SV Salve Mundi. Een enthousiaste groep studenten die zich inzet voor de vereniging.`}
                        </p>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-auto flex items-center justify-between pt-6 border-t border-[var(--border-color)]/20">
                        {isLoading ? (
                            <Skeleton className="h-10 w-32" rounded="xl" />
                        ) : (
                            <NextLink 
                                href={`/commissies/${slug}`}
                                className="text-sm font-black uppercase tracking-widest text-[var(--color-purple-500)] hover:underline decoration-2 underline-offset-4"
                            >
                                Meer informatie
                            </NextLink>
                        )}

                        {!isLoading && (
                            <div className="flex gap-2">
                                {hasHistory && (
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-[var(--text-muted)] transition hover:text-[var(--color-purple-500)]" title="Historie beschikbaar">
                                        <History className="h-5 w-5" />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
