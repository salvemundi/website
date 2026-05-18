import React from 'react';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland, { type Member } from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { isMemberAdmin } from '@/lib/auth';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { type EnrichedUser } from '@/types/auth';
import { query } from '@/lib/database';


export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi'
};

export default async function LedenBeheerPage() {
    const session = await getEnrichedSession();

    if (!session) return <AdminUnauthorized />;

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

    const excludedList = EXCLUDED_EMAILS.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `
        SELECT id, first_name, last_name, email, membership_expiry, status
        FROM directus_users
        WHERE email IS NOT NULL AND email NOT IN (${excludedList})
        ORDER BY last_name ASC, first_name ASC
    `;
    const { rows } = await query(sql, EXCLUDED_EMAILS);

    members = rows as unknown as Member[];
    totalCount = rows.length;

    const today = new Date();
    const activeCount = members.filter(m => {
        if (!m.membership_expiry) return false;
        const expiry = new Date(m.membership_expiry);
        return !isNaN(expiry.getTime()) && expiry >= today;
    }).length;
    const inactiveCount = totalCount - activeCount;

    return (
        <AdminPageShell
            title="Leden Overzicht"
            subtitle="Beheer alle Salve Mundi leden en lidmaatschappen"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 bg-[var(--beheer-card-soft)] px-4 py-2 rounded-2xl border border-[var(--beheer-border)]/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Totaal</span>
                            <span className="text-sm font-bold text-[var(--beheer-text)] leading-none">{totalCount}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Actief</span>
                            <span className="text-sm font-bold text-[var(--beheer-active)] leading-none">{activeCount}</span>
                        </div>
                        <div className="w-px h-6 bg-[var(--beheer-border)]/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] leading-none mb-1">Verlopen</span>
                            <span className="text-sm font-bold text-[var(--beheer-inactive)] leading-none">{inactiveCount}</span>
                        </div>
                    </div>
                </div>
            }
        >
            <LedenOverzichtIsland
                initialMembers={members}
            />
        </AdminPageShell>
    );
}
