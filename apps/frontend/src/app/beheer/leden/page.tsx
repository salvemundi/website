import React from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { getSystemDirectus } from '@/lib/directus';
import { readUsers } from '@directus/sdk';
import { isMemberAdmin } from '@/lib/auth';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';


export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi',
};

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

    // NUCLEAR SSR: Fetch all members at the top level
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
    } catch (e: any) {}

    return (
        <AdminPageShell
            title="Leden Overzicht"
            subtitle="Beheer alle Salve Mundi leden en lidmaatschappen"
            backHref="/beheer"
        >
            <LedenOverzichtIsland 
                initialMembers={members as any} 
                initialTotalCount={totalCount} 
            />
        </AdminPageShell>
    );
}
