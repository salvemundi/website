import React from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland, { type Member } from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { isMemberAdmin } from '@/lib/auth';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { type EnrichedUser } from '@/types/auth';
import { query } from '@/lib/database';


export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi',
};

export default async function LedenPage() {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session || !session.user) return <AdminUnauthorized />;

    const user = session.user as unknown as EnrichedUser;
    if (!isMemberAdmin(user.committees)) {
        return (
            <AdminUnauthorized 
                title="Leden Beheer"
                description="Je hebt geen rechten om (persoons)gegevens van leden te bekijken."
            />
        );
    }

    let members: Member[] = [];
    let totalCount = 0;

    try {
        const excludedList = EXCLUDED_EMAILS.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `
            SELECT id, first_name, last_name, email, membership_expiry, status
            FROM directus_users
            WHERE email IS NOT NULL AND email NOT IN (${excludedList})
            ORDER BY last_name ASC, first_name ASC
        `;
        const { rows } = await query(sql, EXCLUDED_EMAILS);
        members = rows;
        totalCount = rows.length;
    } catch (e) {
        // Silently fail, showing empty list
    }

    return (
        <AdminPageShell
            title="Leden Overzicht"
            subtitle="Beheer alle Salve Mundi leden en lidmaatschappen"
            backHref="/beheer"
        >
            <LedenOverzichtIsland 
                initialMembers={members} 
                initialTotalCount={totalCount} 
            />
        </AdminPageShell>
    );
}
