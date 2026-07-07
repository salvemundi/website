import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import MembershipFormIsland from '@/components/islands/membership/MembershipFormIsland';
import MembershipStatusIsland, { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { fetchUserCommitteesDb, type Committee } from '@/server/internal/leden/leden-db.utils';
import { connection } from 'next/server';
import { safeConsoleError } from '@/server/utils/logger';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

export const metadata = {
    title: 'Word Lid | Salve Mundi',
    description: 'Beheer je lidmaatschap bij Salve Mundi.'
};


export default async function MembershipPage() {
    await connection();

    const session = await getEnrichedSession();

    const user = session?.user as MembershipUserData | undefined;
    const isGuest = !user;

    let committees: Committee[] = [];
    if (user) {
        try {
            committees = await fetchUserCommitteesDb(user.id);
        } catch (error) {
            safeConsoleError('[page.tsx][MembershipPage] Error fetching committees:', error);
        }
    }

    const isExpired = user && user.membership_status !== 'active';
    const isCommitteeMember = committees.length > 0;
    const baseAmount = (isCommitteeMember && isExpired) ? 10.00 : 20.00;

    return (
        <PublicPageShell
            title={isGuest ? "Word Lid!" : "Mijn Lidmaatschap"}
            backgroundImage="" // Default gradient
        >
            <div className="max-w-app mx-auto">
                <div className={isGuest ? "flex flex-col sm:flex-row gap-6 px-6 pt-8 pb-16 sm:pt-10 sm:pb-24 md:pt-12 md:pb-32" : "px-6 pt-8 pb-16 sm:pt-10 sm:pb-24 md:pt-12 md:pb-32"}>
                    <StandardFormCard
                        title={isGuest ? 'Inschrijven' : (user.membership_status === 'active' ? 'STATUS' : 'VERLENGEN')}
                        className={isGuest ? 'w-full sm:w-1/2' : 'w-full max-w-2xl mx-auto'}
                    >
                        {isGuest ? (
                            <MembershipFormIsland baseAmount={baseAmount} />
                        ) : (
                            <MembershipStatusIsland user={user as MembershipUserData} baseAmount={baseAmount} />
                        )}
                    </StandardFormCard>

                    {isGuest && (
                        <aside className="w-full sm:w-1/2 flex flex-col gap-6">
                            <div className="w-full text-center bg-bg-card dark:border dark:border-white/10 squircle-xl p-8 shadow-lg">
                                <h2 className="text-3xl font-black text-theme-purple mb-4 tracking-tight">
                                    Waarom Lid Worden?
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
