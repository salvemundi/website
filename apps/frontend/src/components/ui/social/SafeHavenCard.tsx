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
export default function SafeHavenCard({ isLoading = false, safeHaven }: SafeHavenCardProps) {
    const imageUrl = safeHaven?.afbeelding_id 
        ? getImageUrl(safeHaven.afbeelding_id, { width: 200, height: 200, fit: 'cover' }) 
        : '/img/newlogo.png';

    return (
        <div 
            className={`flex flex-col rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30 p-5 sm:p-6 transition-all duration-300 
                ${!isLoading ? 'hover:border-slate-300 dark:hover:border-slate-600/50 shadow-sm hover:shadow-md' : 'skeleton-active pointer-events-none'}`}
            aria-busy={isLoading}
        >
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-md shrink-0 bg-slate-200 dark:bg-slate-800">
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
                        {safeHaven?.naam || 'Loading Name...'}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Safe Haven
                    </p>
                </div>
            </div>

            <div className="mt-4 space-y-2">
                <p className="text-sm text-theme-muted leading-relaxed line-clamp-3">
                    {safeHaven?.beschrijving || 'Loading description content for the safe haven...'}
                </p>
            </div>

            <div className="mt-5 space-y-2">
                {safeHaven?.email || safeHaven?.telefoon || isLoading ? (
                    <>
                        <ObfuscatedEmail 
                            email={safeHaven?.email || 'loading@salvemundi.nl'} 
                            className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-3 text-sm font-medium text-theme hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full" 
                        />
                        {(safeHaven?.telefoon || isLoading) && (
                            <div className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-3 text-sm font-medium text-theme">
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span>{safeHaven?.telefoon || '06 12345678'}</span>
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
