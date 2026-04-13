import React, { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readUsers } from '@directus/sdk';
import { isMemberAdmin } from '@/lib/auth';

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl', 'github@salvemundi.nl', 'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl', 'voorzitter@salvemundi.nl', 'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl', 'penningmeester@salvemundi.nl', 'noreply@salvemundi.nl',
    'extern@salvemundi.nl', 'commissaris.administratie@salvemundi.nl', 'apibot@salvemundi.nl'
];

export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi',
};

async function LedenDataLoader() {
    let members: any[] = [];
    let totalCount = 0;

    try {
        const query: any = {
            fields: ['id', 'first_name', 'last_name', 'email', 'membership_expiry', 'status'],
            limit: -1,
            sort: ['last_name', 'first_name'],
            filter: {
                _and: [
                    { email: { _nnull: true } },
                    { email: { _nin: EXCLUDED_EMAILS } }
                ]
            }
        };

        const res = await getSystemDirectus().request(readUsers(query));
        if (Array.isArray(res)) {
            members = res;
            totalCount = res.length;
        }
    } catch (e: any) {
        // Error handled by island hydration
    }

    return (
        <LedenOverzichtIsland 
            initialMembers={members as any} 
            initialTotalCount={totalCount} 
        />
    );
}

export default async function LedenPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session || !session.user) return <AdminUnauthorized />;

    const user = session.user as any;
    if (!isMemberAdmin(user.committees)) {
        return (
            <AdminUnauthorized 
                title="Leden Beheer"
                description="Je hebt geen rechten om (persoons)gegevens van leden te bekijken."
            />
        );
    }

    return (
        <AdminPageShell
            title="Leden Overzicht"
            subtitle="Beheer alle Salve Mundi leden en lidmaatschappen"
            backHref="/beheer"
        >
            <Suspense fallback={<LedenOverzichtIsland isLoading={true} />}>
                <LedenDataLoader />
            </Suspense>
        </AdminPageShell>
    );
}
