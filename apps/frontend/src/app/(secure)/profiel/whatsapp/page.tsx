import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getWhatsAppGroups } from '@/server/actions/profile/profiel.actions';
import { WhatsAppGroupsIsland } from '@/components/islands/social/WhatsAppGroupsIsland';
import BackButton from '@/components/ui/navigation/BackButton';
import { getEnrichedSession } from '@/server/auth/auth-utils';

export const metadata: Metadata = {
    title: 'WhatsApp Groepen | SV Salve Mundi',
    description: 'Word lid van onze exclusieve WhatsApp groepen voor leden.'
};

export default async function WhatsAppGroepenPage() {
    const session = await getEnrichedSession();

    if (!session?.user) {
        redirect('/');
    }

    const groups = await getWhatsAppGroups();
    const gedragscodeUrl = '/gedragscode';

    return (
        <div>
            <header className="bg-(--bg-soft) py-12">
                <div className="mx-auto max-w-app px-4">
                    <div className="mb-6">
                        <BackButton href="/profiel" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-(--text-main)">WhatsApp Groepen</h1>
                    <p className="text-lg text-(--text-muted) mt-2 max-w-3xl">
                        Word lid van onze WhatsApp groepen om verbonden te blijven.
                    </p>
                </div>
            </header>

            <div className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
                <WhatsAppGroupsIsland groups={groups} gedragscodeUrl={gedragscodeUrl} />
            </div>
        </div>
    );
}
