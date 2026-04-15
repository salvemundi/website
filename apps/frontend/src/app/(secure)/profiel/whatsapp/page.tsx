export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { getWhatsAppGroups } from '@/server/actions/profiel.actions';
import { WhatsAppGroupsIsland } from '@/components/islands/social/WhatsAppGroupsIsland';

export const metadata: Metadata = {
    title: 'WhatsApp Groepen | SV Salve Mundi',
    description: 'Word lid van onze exclusieve WhatsApp groepen voor leden.',
};

export default async function WhatsAppGroepenPage() {
    // NUCLEAR SSR: Fetch groups and settings at the top level
    const groups = await getWhatsAppGroups();
    const DIRECTUS_URL = process.env.PUBLIC_URL || 'https://salvemundi.nl';
    const gedragscodeUrl = `${DIRECTUS_URL}/gedragscode`;

    return (
        <div className="bg-[var(--bg-main)]">
            <header className="bg-[var(--bg-soft)] py-12">
                <div className="mx-auto max-w-app px-4">
                    <h1 className="text-4xl font-extrabold text-[var(--text-main)]">WhatsApp Groepen</h1>
                    <p className="text-lg text-[var(--text-muted)] mt-2 max-w-3xl">
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


