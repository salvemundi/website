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

    const hasHistory = (committee as Committee & { has_history?: boolean }).has_history ?? false;
    const hasImage = !!committee.image;
    const imageUrl = getImageUrl(committee.image);

    return (
        <NextLink
            href={`/commissies/${slug}`}
            className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-(--bg-card) shadow-lg transition hover:-translate-y-1 hover:shadow-2xl sm:rounded-3xl dark:border dark:border-white/10 
                ${isBestuur ? 'ring-4 shadow-purple-500/10 ring-purple-500/20' : ''}`}
        >
            <div className={`relative w-full overflow-hidden bg-linear-to-br from-purple-500/20 to-purple-900/40 ${isBestuur ? 'h-61 sm:h-72 md:h-80' : 'h-61'}`}>
                {hasImage && isBestuur && (
                    <Image
                        src={imageUrl}
                        alt=""
                        fill
                        className="pointer-events-none object-cover opacity-25 blur-xl select-none"
                    />
                )}
                {!hasImage ? (
                    <>
                        <Image
                            src={BRAND_CONFIG.logoFallbackLight}
                            alt={committee.name || 'Committee'}
                            fill
                            className="object-contain p-12 opacity-40 dark:hidden"
                            priority={index < 4}
                        />
                        <Image
                            src={BRAND_CONFIG.logoFallbackDark}
                            alt={committee.name || 'Committee'}
                            fill
                            className="hidden object-contain p-12 opacity-40 dark:block"
                            priority={index < 4}
                        />
                    </>
                ) : (
                    <Image
                        src={imageUrl}
                        alt={committee.name || 'Committee'}
                        fill
                        className={isBestuur ? 'object-contain' : 'object-cover'}
                        priority={index < 4}
                    />
                )}
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />

                {isBestuur && (
                    <div className="absolute top-4 right-4 rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 shadow-lg">
                        Huidig Bestuur
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-black tracking-tight wrap-break-word hyphens-auto text-purple-700 transition-colors group-hover:text-purple-600 md:text-2xl lg:text-xl xl:text-2xl dark:text-purple-300 dark:group-hover:text-purple-400">
                            {cleanedName || 'Commissie'}
                        </h3>

                        <div className="mt-1 flex items-center gap-2">
                            <div className="flex -space-x-2">
                                {members.slice(0, 3).map((member, i) => (
                                    <div key={i} className="relative size-6 overflow-hidden rounded-full border-2 border-(--bg-card) bg-slate-200 dark:bg-slate-800">
                                        {member.avatar ? (
                                            <Image src={member.avatar} alt="Member" fill className="object-cover" />
                                        ) : (
                                            <>
                                                <Image src={BRAND_CONFIG.logoFallbackLight} alt="Member" fill className="object-cover dark:hidden" />
                                                <Image src={BRAND_CONFIG.logoFallbackDark} alt="Member" fill className="hidden object-cover dark:block" />
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <span className="ml-1 flex items-center gap-1.5 text-xs font-semibold text-(--text-muted)">
                                <Users className="size-3" />
                                {(committee.members?.length || 0)} Leden
                            </span>
                        </div>
                    </div>
                </div>

                <p className="mb-8 line-clamp-3 text-sm leading-relaxed text-(--text-muted)">
                    {committee.short_description || `Maak kennis met de ${cleanedName} van SV Salve Mundi.`}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-(--border-color)/20 pt-6">
                    <span className="text-sm font-bold text-purple-600 decoration-2 underline-offset-4 group-hover:underline dark:text-purple-400">
                        Meer informatie
                    </span>

                    {hasHistory && !isBestuur && (
                        <div className="flex size-10 items-center justify-center rounded-xl bg-(--bg-soft) text-(--text-muted) transition" title="Historie">
                            <History className="size-5" />
                        </div>
                    )}
                </div>
            </div>
        </NextLink>
    );
};

