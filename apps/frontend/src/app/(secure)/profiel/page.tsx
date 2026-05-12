import ProfielDetails from '@/components/islands/account/ProfielIsland';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.'
};

export default async function ProfielPage() {
    const { user: enrichedUser } = await checkAdminAccess();

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {enrichedUser && (
                    <ProfielDetails user={enrichedUser} />
                )}
            </div>
        </PublicPageShell>
    );
}