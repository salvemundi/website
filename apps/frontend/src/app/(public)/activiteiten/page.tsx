import React, { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import ActivitiesBannerIsland from '@/components/islands/activities/ActivitiesBannerIsland';
import ActivitiesProviderIsland from '@/components/islands/activities/ActivitiesProviderIsland';
import { getActivities } from '@/server/actions/activiteit-actions';

export const metadata = {
    title: 'Activiteiten | SV Salve Mundi',
    description: 'Bekijk alle activiteiten, trainingen en feesten van Salve Mundi.',
};

export const dynamic = 'force-dynamic';

export default async function ActivitiesPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const sessionPromise = auth.api.getSession({ headers: await headers() });
    const activitiesPromise = getActivities(); // Use a single fetch for all
    
    const [session, events] = await Promise.all([
        sessionPromise.catch(() => null),
        activitiesPromise.catch(() => [])
    ]);
    
    // Stable server time for hydration-safe countdown and filtering
    const serverTime = new Date().toISOString();

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-app px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
                <div className="mx-auto max-w-7xl">
                    {/* Industrial Columnar Bento Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        
                        {/* MAIN COLUMN (LEFT) - List & Calendar */}
                        <div className="lg:col-span-8 space-y-6">
                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] dark:border-white/10 shadow-lg p-6 sm:p-8">
                                <ActivitiesProviderIsland events={events as any} serverTime={serverTime} />
                            </section>
                        </div>

                        {/* SIDE COLUMN (RIGHT) - Banner/Stats & Quick Info */}
                        <div className="lg:col-span-4 space-y-6">
                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--bg-card)] border border-[var(--border-color)] dark:border-white/10 shadow-lg p-6 sm:p-8">
                                <ActivitiesBannerIsland events={events as any} serverTime={serverTime} />
                            </section>

                            {/* Additional Industrial Info Card */}
                            <section className="rounded-2xl sm:rounded-3xl bg-[var(--color-purple-600)] text-white shadow-xl p-6 sm:p-8 transition-transform hover:scale-[1.02] duration-300">
                                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                                    <span className="text-2xl">✨</span> Lid Worden?
                                </h3>
                                <p className="text-white/90 text-sm leading-relaxed mb-6">
                                    Wil je korting op onze activiteiten en toegang tot exclusieve evenementen? 
                                    Word nu lid voor slechts €5 per jaar!
                                </p>
                                <a 
                                    href="/lidmaatschap" 
                                    className="inline-block w-full bg-white text-[var(--color-purple-600)] font-bold text-center py-3 rounded-xl hover:bg-white/90 transition-colors"
                                >
                                    Meld je aan
                                </a>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </PublicPageShell>
    );
}
