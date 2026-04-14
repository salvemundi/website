import Image from 'next/image';
import type { SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { Phone } from 'lucide-react';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

interface SafeHavenCardProps {
    isLoading?: boolean;
    safeHaven?: SafeHaven;
}

/**
 * SafeHavenCard: Zero-Drift Modernization.
 * Removed manual skeleton branches. Uses .skeleton-active for premium masking.
 */
export default function SafeHavenCard({ safeHaven }: SafeHavenCardProps) {
    const imageUrl = safeHaven?.afbeelding_id 
        ? getImageUrl(safeHaven.afbeelding_id, { width: 200, height: 200, fit: 'cover' }) 
        : '/img/newlogo.png';

    return (
        <div 
            className="flex flex-col rounded-2xl bg-[var(--bg-main)]/30 border border-[var(--border-color)] p-5 sm:p-6 transition-all duration-300 hover:border-[var(--color-purple-300)] dark:hover:border-white/20 shadow-sm hover:shadow-md h-full"
        >
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-md shrink-0 bg-[var(--bg-main)]">
                    <Image
                        src={imageUrl}
                        alt={safeHaven?.naam || 'Safe Haven'}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-theme truncate">
                        {safeHaven?.naam || ''}
                    </h3>
                    <p className="text-sm font-medium text-[var(--color-purple-500)]">
                        Safe Haven
                    </p>
                </div>
            </div>

            {safeHaven?.beschrijving && (
                <div className="mt-4 flex-1">
                    <p className="text-sm text-theme-muted leading-relaxed line-clamp-4">
                        {safeHaven.beschrijving}
                    </p>
                </div>
            )}

            <div className="mt-5 space-y-2">
                {safeHaven?.email || safeHaven?.telefoon ? (
                    <>
                        <ObfuscatedEmail 
                            email={safeHaven?.email || ''} 
                            className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3 text-sm font-medium text-theme hover:border-[var(--color-purple-300)] transition-colors w-full shadow-sm"
                        />
                        {safeHaven?.telefoon && (
                            <div className="flex items-center gap-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-3 text-sm font-medium text-theme shadow-sm">
                                <Phone className="h-4 w-4 text-[var(--color-purple-400)]" />
                                <span>{safeHaven.telefoon}</span>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 p-3">
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 text-center">
                            Log in om contactgegevens te zien
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
