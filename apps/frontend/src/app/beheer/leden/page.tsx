import React from 'react';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland, { type Member } from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { db, schema } from '@salvemundi/db';
import { isNotNull, notInArray, and, asc } from 'drizzle-orm';


export const metadata = {
    title: 'Leden Beheer | SV Salve Mundi'
};

export default async function LedenBeheerPage() {

    let members: Member[] = [];
    let totalCount = 0;

    const rows = await db.select({
        id: schema.directus_users.id,
        first_name: schema.directus_users.first_name,
        last_name: schema.directus_users.last_name,
        email: schema.directus_users.email,
        membership_expiry: schema.directus_users.membership_expiry,
        status: schema.directus_users.status
    })
    .from(schema.directus_users)
    .where(
        and(
            isNotNull(schema.directus_users.email),
            notInArray(schema.directus_users.email, EXCLUDED_EMAILS)
        )
    )
    .orderBy(asc(schema.directus_users.last_name), asc(schema.directus_users.first_name));

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
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-4 bg-(--beheer-card-soft) px-4 py-2 rounded-2xl border border-(--beheer-border)/50 shadow-sm">
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1">Totaal</span>
                            <span className="text-sm font-bold text-(--beheer-text) leading-none">{totalCount}</span>
                        </div>
                        <div className="w-px h-6 bg-(--beheer-border)/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1">Actief</span>
                            <span className="text-sm font-bold text-(--beheer-active) leading-none">{activeCount}</span>
                        </div>
                        <div className="w-px h-6 bg-(--beheer-border)/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="text-[10px] font-semibold text-(--beheer-text-muted) leading-none mb-1">Verlopen</span>
                            <span className="text-sm font-bold text-(--beheer-inactive) leading-none">{inactiveCount}</span>
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
