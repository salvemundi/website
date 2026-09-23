import Image from 'next/image';
import { Phone } from 'lucide-react';
import type { IntroConfidant } from '@salvemundi/validations/schema/intro.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { BRAND_CONFIG } from '@/lib/config/brand';

interface IntroConfidantCardProps {
    confidant: IntroConfidant;
}

export default function IntroConfidantCard({ confidant }: IntroConfidantCardProps) {
    const imageUrl = confidant.image
        ? getImageUrl(confidant.image, { width: 640, height: 480, fit: 'cover' })
        : null;

    return (
        <div className="squircle-lg bg-bg-main/30 flex h-full flex-col overflow-hidden border border-border-color shadow-sm transition-all duration-300 hover:border-purple-300 hover:shadow-md dark:hover:border-white/20">
            <div className="bg-bg-main relative aspect-4/3 w-full shrink-0">
                {imageUrl ? (
                    <Image src={imageUrl} alt={confidant.name} fill unoptimized className="object-cover object-top" />
                ) : (
                    <>
                        <Image src={BRAND_CONFIG.logoFallbackLight} alt={confidant.name} fill unoptimized className="object-cover dark:hidden" />
                        <Image src={BRAND_CONFIG.logoFallbackDark} alt={confidant.name} fill unoptimized className="hidden object-cover dark:block" />
                    </>
                )}
            </div>

            <div className="flex flex-1 flex-col p-3.5 sm:p-4">
                <h3 className="truncate text-sm font-bold text-theme-purple sm:text-base">{confidant.name}</h3>
                <p className="text-[11px] font-semibold text-purple-500 sm:text-xs">Vertrouwenscontactpersoon</p>

                {confidant.bio && (
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-text-muted">{confidant.bio}</p>
                )}

                <div className="mt-3 space-y-1.5">
                    {confidant.email && (
                        <ObfuscatedEmail
                            email={confidant.email}
                            className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-border-color bg-bg-card px-2.5 py-2 text-xs font-medium text-text-main shadow-sm transition-colors hover:border-purple-300"
                        />
                    )}
                    {confidant.phone_number && (
                        <a
                            href={`tel:${confidant.phone_number.replace(/\s+/g, '')}`}
                            className="flex w-full min-w-0 items-center gap-2 overflow-hidden rounded-lg border border-border-color bg-bg-card px-2.5 py-2 text-xs font-medium text-text-main shadow-sm transition-colors hover:border-purple-300"
                        >
                            <Phone className="size-3.5 shrink-0 text-purple-400" />
                            <span className="truncate">{confidant.phone_number}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
