import NextLink from 'next/link';
import { Users, History } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { slugify } from '@/shared/lib/utils/slug';
import type { Committee } from '@salvemundi/validations/schema/committees.zod';
import Image from 'next/image';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface CommitteeCardProps {
    committee?: Committee;
    index?: number;
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

export const CommitteeCard = ({
    committee = {} as Committee,
    index = 0
}: CommitteeCardProps) => {
    const cleanedName = cleanCommitteeName(committee.name || '');
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');
    const slug = committee.commissie_token || slugify(cleanedName);

    const members = (committee.members || [])
        .filter(m => m.is_visible && m.user_id?.avatar)
        .map(m => ({
            avatar: m.user_id?.avatar ? getImageUrl(m.user_id.avatar) : '',
            name: m.user_id?.first_name || '',
            isLeader: m.is_leader
        }));

    const hasHistory = committee.has_history ?? false;
    const hasImage = !!committee.image;
    const imageUrl = getImageUrl(committee.image);

    return (
        <NextLink
            href={`/commissies/${slug}`}
            className={`group flex h-full flex-col overflow-hidden squircle-lg bg-bg-card dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl 
                ${isBestuur ? 'ring-4 ring-purple-500/20 shadow-purple-500/10' : ''}`}
        >
            <div className={`relative w-full overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-900/40 ${isBestuur ? 'h-61 sm:h-72 md:h-80' : 'h-61'}`}>
                {hasImage && isBestuur && (
                    <Image
                        src={imageUrl}
                        alt=""
                        fill
                        className="object-cover blur-xl opacity-25 scale-105 select-none pointer-events-none"
                        unoptimized
                    />
                )}
                {!hasImage ? (
                    <>
                        <Image
                            src={BRAND_CONFIG.logoFallbackLight}
                            alt={committee.name || 'Committee'}
                            fill
                            className="transition-all duration-500 object-contain p-12 opacity-40 dark:hidden"
                            unoptimized
                            priority={index < 4}
                        />
                        <Image
                            src={BRAND_CONFIG.logoFallbackDark}
                            alt={committee.name || 'Committee'}
                            fill
                            className="transition-all duration-500 object-contain p-12 opacity-40 hidden dark:block"
                            unoptimized
                            priority={index < 4}
                        />
                    </>
                ) : (
                    <Image
                        src={imageUrl}
                        alt={committee.name || 'Committee'}
                        fill
                        className={`transition-all duration-500 ${isBestuur ? 'object-contain' : 'object-cover'}`}
                        unoptimized
                        priority={index < 4}
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

                {isBestuur && (
                    <div className="absolute right-4 top-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 shadow-lg">
                        Huidig Bestuur
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl md:text-2xl lg:text-xl xl:text-2xl font-black tracking-tight text-theme-purple group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors break-words hyphens-auto">
                            {cleanedName || 'Commissie'}
                        </h3>

                        <div className="flex items-center gap-2 mt-1">
                            <div className="flex -space-x-2">
                                {members.slice(0, 3).map((member, i) => (
                                    <div key={i} className="relative h-6 w-6 rounded-full border-2 border-bg-card overflow-hidden bg-slate-200 dark:bg-slate-800">
                                        {member.avatar ? (
                                            <Image src={member.avatar} alt="Member" fill className="object-cover" unoptimized />
                                        ) : (
                                            <>
                                                <Image src={BRAND_CONFIG.logoFallbackLight} alt="Member" fill className="object-cover dark:hidden" unoptimized />
                                                <Image src={BRAND_CONFIG.logoFallbackDark} alt="Member" fill className="object-cover hidden dark:block" unoptimized />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span className="text-xs font-semibold text-text-muted flex items-center gap-1.5 ml-1">
                                <Users className="h-3 w-3" />
                                {(committee.members?.length || 0)} Leden
                            </span>
                        </div>
                    </div>
                </div>

                <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-text-muted">
                    {committee.short_description || `Maak kennis met de ${cleanedName} van SV Salve Mundi.`}
                </p>

                <div className="mt-auto flex items-center justify-between pt-6 border-t border-border-color/20">
                    <span className="text-sm font-bold text-purple-500 decoration-2 underline-offset-4 group-hover:underline">
                        Meer informatie
                    </span>

                    {hasHistory && !isBestuur && (
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bg-soft text-text-muted transition" title="Historie">
                            <History className="h-5 w-5" />
                        </div>
                    )}
                </div>
            </div>
        </NextLink>
    );
};