import Image from 'next/image';
import type { SafeHaven } from '@salvemundi/validations';
import { Mail, Phone } from 'lucide-react';
import { getImageUrl } from '@/lib/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';

interface SafeHavenCardProps {
    isLoading?: boolean;
    safeHaven?: SafeHaven;
}

/**
 * UI Component voor een Vertrouwenspersoon (Safe Haven) kaart.
 * Zorgt voor een consistente visuele presentatie die aansluit bij de vastgestelde ontwerprichtlijnen.
 * Ondersteunt nu een geïntegreerde loading-state.
 */
export default function SafeHavenCard({ isLoading = false, safeHaven }: SafeHavenCardProps) {
    const imageUrl = safeHaven?.afbeelding_id 
        ? getImageUrl(safeHaven.afbeelding_id, { width: 200, height: 200, fit: 'cover' }) 
        : '/img/newlogo.png';

    return (
        <div 
            className={`flex flex-col rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30 p-5 sm:p-6 transition-all duration-300 ${!isLoading ? 'hover:border-slate-300 dark:hover:border-slate-600/50' : 'animate-pulse'}`}
            aria-busy={isLoading}
        >
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-md shrink-0 bg-slate-200 dark:bg-slate-800">
                    {!isLoading && safeHaven && (
                        <Image
                            src={imageUrl}
                            alt={safeHaven.naam}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    {isLoading ? (
                        <div className="space-y-2">
                            <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                            <div className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800 rounded opacity-50" />
                        </div>
                    ) : (
                        <>
                            <h3 className="text-lg sm:text-xl font-bold text-theme truncate">
                                {safeHaven?.naam}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Vertrouwenspersoon
                            </p>
                        </>
                    )}
                </div>
            </div>

            <div className="mt-4 space-y-2">
                {isLoading ? (
                    <>
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded opacity-40" />
                        <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded opacity-40" />
                    </>
                ) : safeHaven?.beschrijving && (
                    <p className="text-sm text-theme-muted leading-relaxed line-clamp-3">
                        {safeHaven.beschrijving}
                    </p>
                )}
            </div>

            <div className="mt-5 space-y-2">
                {isLoading ? (
                    <>
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                        <div className="h-10 w-full bg-slate-200 dark:bg-slate-800 rounded-xl" />
                    </>
                ) : safeHaven?.email || safeHaven?.telefoon ? (
                    <>
                        {safeHaven.email && (
                            <ObfuscatedEmail 
                                email={safeHaven.email} 
                                className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-3 text-sm font-medium text-theme hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full" 
                            />
                        )}
                        {safeHaven.telefoon && (
                            <a
                                href={`tel:${safeHaven.telefoon}`}
                                className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-3 text-sm font-medium text-theme hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <Phone className="h-4 w-4 text-slate-400" />
                                <span>{safeHaven.telefoon}</span>
                            </a>
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

