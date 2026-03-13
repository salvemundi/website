import Image from 'next/image';
import type { SafeHaven } from '@salvemundi/validations';
import { Mail, Phone } from 'lucide-react';

interface SafeHavenCardProps {
    safeHaven: SafeHaven;
}

/**
 * UI Component voor een Vertrouwenspersoon (Safe Haven) kaart.
 * Matcht de exacte legacy opmaak en styling.
 */
export default function SafeHavenCard({ safeHaven }: SafeHavenCardProps) {
    // Afbeeldings-URL opbouwen via de interne asset-proxy
    const imageUrl = safeHaven.afbeelding_id
        ? `/api/assets/${safeHaven.afbeelding_id}?width=200&height=200&fit=cover`
        : '/img/newlogo.png'; // Fallback indien geen afbeelding

    return (
        <div className="flex flex-col rounded-2xl bg-slate-50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-700/30 p-5 sm:p-6 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-600/50">
            <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-2xl shadow-md shrink-0">
                    <Image
                        src={imageUrl}
                        alt={safeHaven.naam}
                        fill
                        unoptimized
                        className="object-cover"
                    />
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-theme truncate">
                        {safeHaven.naam}
                    </h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        Vertrouwenspersoon
                    </p>
                </div>
            </div>

            {safeHaven.beschrijving && (
                <p className="mt-4 text-sm text-theme-muted leading-relaxed line-clamp-3">
                    {safeHaven.beschrijving}
                </p>
            )}

            <div className="mt-5 space-y-2">
                {safeHaven.email || safeHaven.telefoon ? (
                    <>
                        {safeHaven.email && (
                            <a
                                href={`mailto:${safeHaven.email}`}
                                className="flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 p-3 text-sm font-medium text-theme hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                            >
                                <Mail className="h-4 w-4 text-slate-400" />
                                <span className="truncate">{safeHaven.email}</span>
                            </a>
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
