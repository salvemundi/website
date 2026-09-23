import { Lock, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getImageUrl } from '@/lib/utils/image-utils';
import { stripHtmlToText } from '@/lib/utils/html-utils';
import { DiscordIcon } from '@/shared/icons/social';
import { ROUTES } from '@/lib/config/routes';
import type { Club } from '@salvemundi/validations/schema/clubs.zod';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface ClubCardProps {
    club: Club;
    index?: number;
    isActiveMember?: boolean;
}

export const ClubCard = ({ club, index = 0, isActiveMember = false }: ClubCardProps) => {
    const hasImage = !!club.image;
    const imageUrl = getImageUrl(club.image);
    const description = club.description ? stripHtmlToText(club.description) : null;
    const needsExpand = !!description && (description.length > 160 || description.includes('\n'));

    return (
        <div className="group squircle-lg flex h-full flex-col overflow-hidden bg-bg-card shadow-lg transition hover:-translate-y-1 hover:shadow-2xl dark:border dark:border-white/10">
            <div className="relative h-61 w-full overflow-hidden bg-linear-to-br from-purple-500/20 to-purple-900/40">
                {!hasImage ? (
                    <>
                        <Image
                            src={BRAND_CONFIG.logoFallbackLight}
                            alt={club.name}
                            fill
                            className="object-contain p-12 opacity-40 transition-all duration-500 dark:hidden"
                            unoptimized
                            priority={index < 4}
                        />
                        <Image
                            src={BRAND_CONFIG.logoFallbackDark}
                            alt={club.name}
                            fill
                            className="hidden object-contain p-12 opacity-40 transition-all duration-500 dark:block"
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
                <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent" />
            </div>

            <div className="flex flex-1 flex-col p-6 sm:p-8">
                <h3 className="mb-4 text-xl font-black tracking-tight wrap-break-word hyphens-auto text-theme-purple md:text-2xl">
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
                        <p className="mb-8 text-sm leading-relaxed whitespace-pre-line text-text-muted">
                            {description}
                        </p>
                    )
                )}

                {(club.whatsapp_link || club.discord_link) && (
                    <div className="mt-auto flex flex-col gap-2">
                        {club.whatsapp_link && (
                            isActiveMember ? (
                                <a
                                    href={club.whatsapp_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500/10 px-4 py-3 text-sm font-bold text-green-600 transition hover:bg-green-500/20 dark:text-green-400"
                                >
                                    <MessageCircle className="size-4" />
                                    WhatsApp groep
                                </a>
                            ) : (
                                <Link
                                    href={ROUTES.MEMBERSHIP}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-bg-soft px-4 py-3 text-sm font-bold text-text-muted transition hover:bg-bg-soft/70"
                                    title="Alleen zichtbaar voor leden met een actief lidmaatschap"
                                >
                                    <Lock className="size-4" />
                                    Alleen voor leden
                                </Link>
                            )
                        )}

                        {club.discord_link && (
                            <a
                                href={club.discord_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-600 transition hover:bg-indigo-500/20 dark:text-indigo-400"
                            >
                                <DiscordIcon className="size-4" />
                                Discord
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
