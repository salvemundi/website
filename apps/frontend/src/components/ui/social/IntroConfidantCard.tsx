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
        <div className="flex flex-col squircle-lg bg-bg-main/30 border border-border-color overflow-hidden transition-all duration-300 hover:border-purple-300 dark:hover:border-white/20 shadow-sm hover:shadow-md h-full">
            <div className="relative w-full aspect-[4/3] shrink-0 bg-bg-main">
                {imageUrl ? (
                    <Image src={imageUrl} alt={confidant.name} fill unoptimized className="object-cover object-top" />
                ) : (
                    <>
                        <Image src={BRAND_CONFIG.logoFallbackLight} alt={confidant.name} fill unoptimized className="object-cover dark:hidden" />
                        <Image src={BRAND_CONFIG.logoFallbackDark} alt={confidant.name} fill unoptimized className="object-cover hidden dark:block" />
                    </>
                )}
            </div>

            <div className="flex flex-col flex-1 p-3.5 sm:p-4">
                <h3 className="text-sm sm:text-base font-bold text-theme-purple truncate">{confidant.name}</h3>
                <p className="text-[11px] sm:text-xs font-semibold text-purple-500">Vertrouwenscontactpersoon</p>

                {confidant.bio && (
                    <p className="mt-2 text-xs text-text-muted leading-relaxed line-clamp-2">{confidant.bio}</p>
                )}

                <div className="mt-3 space-y-1.5">
                    {confidant.email && (
                        <ObfuscatedEmail
                            email={confidant.email}
                            className="flex items-center gap-2 min-w-0 overflow-hidden rounded-lg bg-bg-card border border-border-color px-2.5 py-2 text-xs font-medium text-text-main hover:border-purple-300 transition-colors w-full shadow-sm"
                        />
                    )}
                    {confidant.phone_number && (
                        <a
                            href={`tel:${confidant.phone_number.replace(/\s+/g, '')}`}
                            className="flex items-center gap-2 min-w-0 overflow-hidden rounded-lg bg-bg-card border border-border-color px-2.5 py-2 text-xs font-medium text-text-main hover:border-purple-300 transition-colors w-full shadow-sm"
                        >
                            <Phone className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                            <span className="truncate">{confidant.phone_number}</span>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
