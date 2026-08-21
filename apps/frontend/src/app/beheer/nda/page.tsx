import type { Metadata } from 'next';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import NdaOverviewIsland from '@/components/islands/admin/nda/NdaOverviewIsland';
import { getNdaOverview } from '@/server/actions/admin/nda/admin-nda-templates.actions';
import { getNdaSettings, getBestuurMembersForSecretaryPicker } from '@/server/actions/admin/nda/admin-nda-settings.actions';

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
        <AdminPageShell title="NDA Beheer" subtitle="Geheimhoudingsverklaringen per commissie" backHref="/beheer">
            <NdaOverviewIsland
                initialOverview={overview}
                bestuurMembers={bestuurMembers}
                initialSecretaryUserId={settings.secretaryUserId}
                initialIsActive={settings.isActive}
            />
        </AdminPageShell>
    );
}
