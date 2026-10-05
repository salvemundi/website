import Image from 'next/image';
import type { SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { Phone } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

import { BRAND_CONFIG } from '@/lib/config/brand';

interface SafeHavenCardProps {
    safeHaven?: SafeHaven;
}

export default function SafeHavenCard({ safeHaven }: SafeHavenCardProps) {
    const imageUrl = safeHaven?.image
        ? getImageUrl(safeHaven.image, { width: 200, height: 200, fit: 'cover' })
        : null;

    return (
        <div
            className="flex h-full flex-col squircle-lg border border-border-color bg-bg-main/30 p-5 shadow-xs transition-all duration-300 hover:border-theme-purple/40 hover:shadow-md sm:p-6"
        >
            <div className="flex items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden squircle bg-bg-main shadow-md sm:size-20">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={safeHaven?.contact_name || 'Safe Haven'}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        <>
                            <Image
                                src={BRAND_CONFIG.logoFallbackLight}
                                alt={safeHaven?.contact_name || 'Safe Haven'}
                                fill
                                unoptimized
                                className="object-cover dark:hidden"
                            />
                            <Image
                                src={BRAND_CONFIG.logoFallbackDark}
                                alt={safeHaven?.contact_name || 'Safe Haven'}
                                fill
                                unoptimized
                                className="hidden object-cover dark:block"
                            />
                        </>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-lg font-bold text-theme-purple sm:text-xl">
                        {safeHaven?.contact_name || ''}
                    </h3>
                    <p className="text-sm font-semibold text-theme-purple opacity-80">
                        Safe Haven
                    </p>
                </div>
            </div>

            <div className="mt-5 space-y-2">
                {safeHaven?.email || safeHaven?.phone_number ? (
                    <>
                        <ObfuscatedEmail
                            email={safeHaven.email || ''}
                            className="flex w-full items-center gap-3 rounded-xl border border-border-color bg-bg-card p-3 text-sm font-medium text-text-main shadow-xs transition-colors hover:border-theme-purple/40"
                        />
                        {safeHaven.phone_number && (
                            <div className="flex items-center gap-3 rounded-xl border border-border-color bg-bg-card p-3 text-sm font-medium text-text-main shadow-xs">
                                <Phone className="size-4 text-theme-purple" />
                                <span>{safeHaven.phone_number}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-xl border border-amber-200/50 bg-amber-50/50 p-3 dark:border-amber-800/30 dark:bg-amber-950/20">
                        <p className="text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
                            Log in om contactgegevens te zien
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}