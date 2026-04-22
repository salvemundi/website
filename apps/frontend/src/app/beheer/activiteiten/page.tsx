import React from 'react';
import type { Metadata } from 'next';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import AdminActivitiesIsland from '@/components/islands/admin/activities/AdminActivitiesIsland';
import { getAdminActivities } from '@/server/actions/activiteiten/activities-read.actions';
import { getCommittees } from '@/server/actions/committees.actions';
import { fetchUserCommitteesDb } from '@/server/actions/user-db.utils';
import { getPermissions } from '@/shared/lib/permissions';

export const metadata: Metadata = {
    title: 'Beheer Activiteiten | SV Salve Mundi',
};

export default async function AdminActiviteitenPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    const user = session?.user as any;
    const userCommittees = await fetchUserCommitteesDb(user?.id).catch(() => []);
    const permissions = getPermissions(userCommittees || []);

    const [initialEvents, committees] = await Promise.all([
        getAdminActivities(undefined, 'all').catch(() => []),
        getCommittees().catch(() => [])
    ]);

    return (
        <AdminPageShell
            title="Activiteiten Beheer"
            subtitle="Organiseer en beheer alle activiteiten van Salve Mundi"
            backHref="/beheer"
        >
            <AdminActivitiesIsland 
                initialEvents={initialEvents as any} 
                committees={committees as any}
                userId={session?.user?.id}
                userCommittees={userCommittees || []}
                permissions={permissions}
            />
        </AdminPageShell>
    );
}
