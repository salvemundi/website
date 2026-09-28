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
            <div className="max-w-app mx-auto px-4 py-8 sm:py-12 lg:py-16">
                <div className="mb-12 flex flex-col items-center text-center">
                    <h1 className="mb-4 text-4xl font-black tracking-tight text-theme-purple">
                        Onze Clubs
                    </h1>
                    <p className="max-w-2xl text-lg leading-relaxed font-medium text-text-muted">
                        Clubs zijn groepen waarin alle leden van harte welkom zijn. Sluit je aan bij de WhatsApp groep van een club die je aanspreekt!
                    </p>
                    <div className="mt-6 h-1 w-24 rounded-full bg-linear-to-r from-transparent via-purple-500 to-transparent" />
                </div>
                <ClubsList initialClubs={clubs} isActiveMember={isActiveMember} />
            </div>
        </PublicPageShell>
    );
}
