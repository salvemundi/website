import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import PageHeader from '@/components/ui/layout/PageHeader';
import VerenigingManagementIsland from '@/components/islands/admin/VerenigingManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommittees } from '@/server/actions/admin-committees.actions';

export const metadata: Metadata = {
    title: 'Vereniging Beheer | SV Salve Mundi',
};

export default async function BeheerVerenigingPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const committees = await getCommittees().catch(() => []);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <PageHeader
                title="Vereniging Beheer"
                description="Beheer commissies, leden en leiders van SV Salve Mundi."
                backLink="/beheer"
            />
            <VerenigingManagementIsland initialCommittees={committees} />
        </div>
    );
}
