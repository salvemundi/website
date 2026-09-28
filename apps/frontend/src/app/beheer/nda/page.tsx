import type { Metadata } from 'next';
import BeheerPageShell from '@/components/ui/beheer/BeheerPageShell';
import NdaOverviewIsland from '@/components/islands/beheer/nda/NdaOverviewIsland';
import { getNdaOverview } from '@/server/actions/beheer/nda/beheer-nda-templates.actions';
import { getNdaSettings, getBestuurMembersForSecretaryPicker } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';

export const metadata: Metadata = {
    title: 'NDA Beheer | SV Salve Mundi'
};

export default async function BeheerNdaPage() {
    const [overview, settings, bestuurMembers] = await Promise.all([
        getNdaOverview(),
        getNdaSettings(),
        getBestuurMembersForSecretaryPicker(),
    ]);

    return (
        <BeheerPageShell title="NDA Beheer" subtitle="Geheimhoudingsverklaringen per commissie" backHref="/beheer">
            <NdaOverviewIsland
                initialOverview={overview}
                bestuurMembers={bestuurMembers}
                initialSecretaryUserId={settings.secretaryUserId}
                initialIsActive={settings.isActive}
            />
        </BeheerPageShell>
    );
}
