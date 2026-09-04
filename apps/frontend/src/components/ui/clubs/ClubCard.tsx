import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';
import { stripHtmlToText } from '@/lib/utils/html-utils';
import type { Club } from '@salvemundi/validations/schema/clubs.zod';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface ClubCardProps {
    club: Club;
    index?: number;
}

export const ClubCard = ({ club, index = 0 }: ClubCardProps) => {
    const hasImage = !!club.image;
    const imageUrl = getImageUrl(club.image);
    const description = club.description ? stripHtmlToText(club.description) : null;
    const needsExpand = !!description && (description.length > 160 || description.includes('\n'));

    return (
        <div className="group flex h-full flex-col overflow-hidden squircle-lg bg-bg-card dark:border dark:border-white/10 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
            <div className="relative h-61 w-full overflow-hidden bg-linear-to-br from-purple-500/20 to-purple-900/40">
                {!hasImage ? (
                    <>
                        <Image
                            src={BRAND_CONFIG.logoFallbackLight}
                            alt={club.name}
                            fill
                            className="transition-all duration-500 object-contain p-12 opacity-40 dark:hidden"
                            unoptimized
                            priority={index < 4}
                        />
                        <Image
                            src={BRAND_CONFIG.logoFallbackDark}
                            alt={club.name}
                            fill
                            className="transition-all duration-500 object-contain p-12 opacity-40 hidden dark:block"
                            unoptimized
                            priority={index < 4}
                        />
                    </>
                ) : (
                    <Image
                        src={imageUrl}
                        alt={club.name}
                        fill
                        className="object-cover transition-all duration-500"
                        unoptimized
                        priority={index < 4}
                    />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-theme-purple wrap-break-word hyphens-auto mb-4">
                    {club.name}
                </h3>

                {description && (
                    needsExpand ? (
                        <details className="group mb-8 text-sm leading-relaxed text-text-muted">
                            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                                <p className="line-clamp-3 whitespace-pre-line group-open:hidden">
                                    {description}
                                </p>
                                <p className="hidden whitespace-pre-line group-open:block">
                                    {description}
                                </p>
                                <span className="mt-2 inline-block text-xs font-bold text-purple-500 group-open:hidden">
                                    Lees meer
                                </span>
                            </summary>
                        </details>
                    ) : (
                        <p className="mb-8 whitespace-pre-line text-sm leading-relaxed text-text-muted">
                            {description}
                        </p>
                    )
                )}

                {club.whatsapp_link && (
                    <a
                        href={club.whatsapp_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-600 dark:text-green-400 transition hover:bg-green-500/20"
                    >
                        <MessageCircle className="h-4 w-4" />
                        WhatsApp groep
                    </a>
                )}
            </div>
        </div>
    );
};
