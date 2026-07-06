import React from 'react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profile/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { checkAdminAccess } from '@/server/actions/admin/admin-utils.actions';
import { type SessionUser } from '@/lib/profile/profile-admin.utils';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.'
};

export default async function ProfielPage() {
    const [eventSignups, pubCrawlSignups, adminData] = await Promise.all([
        getUserEventSignups(),
        getUserPubCrawlSignups(),
        checkAdminAccess()
    ]);

    const enrichedUser = adminData.user as SessionUser | null;

    return (
        <PublicPageShell title="Mijn Profiel">
            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {enrichedUser && (
                    <ProfielIsland 
                        user={enrichedUser}
                        initialSignups={eventSignups}
                        pubCrawlSignups={pubCrawlSignups}
                    />
                )}
            </div>
        </PublicPageShell>
    );
}
