import type { Metadata } from 'next';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import ClubsList from '@/components/ui/clubs/ClubsList';

export const metadata: Metadata = {
    title: 'Clubs | SV Salve Mundi',
    description: 'Ontdek de clubs van SV Salve Mundi, waar alle leden welkom zijn.'
};

import { getClubs } from '@/server/actions/public/clubs.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import type { EnrichedUser } from '@/types/auth';

import { connection } from 'next/server';

export default async function ClubsPage() {
    await connection();
    const [clubs, session] = await Promise.all([
        getClubs(),
        getEnrichedSession()
    ]);

    const currentUser = session?.user ? (session.user as unknown as EnrichedUser) : null;
    const isActiveMember = currentUser?.membership_status === 'active';

    return (
        <PublicPageShell>
            <div className="mx-auto max-w-app px-4 py-8 sm:py-12 lg:py-16">
                <div className="flex flex-col items-center mb-12 text-center">
                    <h1 className="text-4xl font-black text-theme-purple mb-4 tracking-tight">
                        Onze Clubs
                    </h1>
                    <p className="text-text-muted max-w-2xl text-lg font-medium leading-relaxed">
                        Clubs zijn groepen waarin alle leden van harte welkom zijn. Sluit je aan bij de WhatsApp groep van een club die je aanspreekt!
                    </p>
                    <div className="h-1 w-24 bg-linear-to-r from-transparent via-purple-500 to-transparent rounded-full mt-6" />
                </div>
                <ClubsList initialClubs={clubs} isActiveMember={isActiveMember} />
            </div>
        </PublicPageShell>
    );
}
