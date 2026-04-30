import React from 'react';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import MembershipFormIsland from '@/components/islands/membership/MembershipFormIsland';
import MembershipStatusIsland, { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { fetchUserCommitteesDb, type Committee } from '@/server/actions/user-db.utils';

export const metadata = {
    title: 'Word Lid | Salve Mundi',
    description: 'Beheer je lidmaatschap bij Salve Mundi.',
};

export const dynamic = 'force-dynamic';

export default async function MembershipPage() {
    // NUCLEAR SSR: Fetch all data before flushing any part of the page content
    const session = await auth.api.getSession({ headers: await headers() });
    const user = session?.user as MembershipUserData | undefined;
    const isGuest = !user;
    
    let committees: Committee[] = [];
    if (user) {
        try {
            committees = await fetchUserCommitteesDb(user.id);
        } catch (error) {
            console.error('[Membership] Error fetching committees:', error);
            throw new Error('Er is een fout opgetreden. Probeer het later opnieuw.');
        }
    }

    const isExpired = user && user.membership_status !== 'active';
    const isCommitteeMember = committees.length > 0;
    const baseAmount = (isCommitteeMember && isExpired) ? 10.00 : 20.00;

    return (
        <PublicPageShell
            title={isGuest ? "WORD LID!" : "MIJN LIDMAATSCHAP"}
            backgroundImage="" // Default gradient
        >
            <div className="max-w-app mx-auto">
                <div className="flex flex-col sm:flex-row gap-6 px-6 py-8 sm:py-10 md:py-12">
                    <section className={`bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] shadow-xl p-6 sm:p-10 ${isGuest ? 'w-full sm:w-1/2' : 'w-full max-w-2xl mx-auto'}`}>
                        <h1 className="text-4xl font-black text-theme-purple dark:text-purple-400 mb-8 tracking-tight">
                            {isGuest ? 'INSCHRIJVEN' : (user?.membership_status === 'active' ? 'STATUS' : 'VERLENGEN')}
                        </h1>

                        {isGuest ? (
                            <MembershipFormIsland baseAmount={baseAmount} />
                        ) : (
                            <MembershipStatusIsland user={user as MembershipUserData} baseAmount={baseAmount} />
                        )}
                    </section>

                    {isGuest && (
                        <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                            <div className="w-full text-center bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-[2rem] p-8 shadow-lg">
                                <h2 className="text-3xl font-black text-theme-purple dark:text-purple-400 mb-4 tracking-tight">
                                    WAAROM WORDEN LID?
                                </h2>
                                <p className="text-lg opacity-80 leading-relaxed font-medium">
                                    Als lid van Salve Mundi krijg je toegang tot exclusieve activiteiten en workshops. 
                                    Word vandaag lid!
                                </p>
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </PublicPageShell>
    );
}
