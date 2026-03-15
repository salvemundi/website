import React, { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import MembershipFormIsland from '@/components/islands/membership/MembershipFormIsland';
import MembershipStatusIsland, { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import MembershipSkeleton from '@/components/ui/membership/MembershipSkeleton';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

export const metadata = {
    title: 'Word Lid | Salve Mundi',
    description: 'Beheer je lidmaatschap bij Salve Mundi en krijg toegang tot exclusieve activiteiten.',
};

async function MembershipDynamicSection() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user;
    const isGuest = !user;
    const baseAmount = 20.00;

    return (
        <section className="w-full sm:w-1/2 bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-10">
            <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-8 tracking-tight">
                {isGuest ? 'INSCHRIJVEN' : (user.membership_status === 'active' ? 'STATUS' : 'VERLENGEN')}
            </h1>

            {isGuest ? (
                <MembershipFormIsland baseAmount={baseAmount} />
            ) : (
                <MembershipStatusIsland user={user as MembershipUserData} baseAmount={baseAmount} />
            )}
        </section>
    );
}

export default function MembershipPage() {
    return (
        <>
            <PageHeader
                title="WORD LID!"
                backgroundImage=""
                contentPadding="py-20"
                imageFilter="brightness(0.65)"
            />

            <main className="max-w-app mx-auto">
                <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
                    {/* Only the dynamic status/form part is suspended */}
                    <Suspense fallback={<MembershipSkeleton />}>
                        <MembershipDynamicSection />
                    </Suspense>

                    {/* Static aside is rendered immediately (PPR) */}
                    <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                        <div className="w-full text-center bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 shadow-lg">
                            <h2 className="text-3xl font-black text-theme-purple dark:text-purple-400 mb-4 tracking-tight">
                                WAAROM LID WORDEN?
                            </h2>
                            <p className="text-lg opacity-80 leading-relaxed font-medium">
                                Als lid van Salve Mundi krijg je toegang tot exclusieve
                                activiteiten, workshops, borrels en nog veel meer! Word vandaag
                                nog lid en ontdek de wereld van ICT samen met ons.
                            </p>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}
