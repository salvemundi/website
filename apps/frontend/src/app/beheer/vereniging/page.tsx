import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

import PageHeader from '@/components/ui/layout/PageHeader';
import VerenigingManagementIsland from '@/components/islands/admin/vereniging/VerenigingManagementIsland';
import { auth } from '@/server/auth/auth';
import { getCommittees } from '@/server/actions/admin-committees.actions';
import { ChevronLeft } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Vereniging Beheer | SV Salve Mundi',
};

export default async function BeheerVerenigingPage() {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect('/login');

    const committees = await getCommittees().catch(() => []);

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <VerenigingManagementIsland initialCommittees={committees} />
        </div>
    );
}
