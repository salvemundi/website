import AdminPageShell from '@/components/ui/admin/AdminPageShell';
import LedenOverzichtIsland, { type Member } from '@/components/islands/admin/leden/LedenOverzichtIsland';
import { EXCLUDED_EMAILS } from '@/shared/lib/constants/admin.constants';
import { db, schema } from '@salvemundi/db';
import { isNotNull, notInArray, and, asc } from 'drizzle-orm';

import { isMembershipActive } from '@/lib/leden/leden-utils';


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
        membership_status: schema.directus_users.membership_status,
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

    const activeCount = members.filter(m => isMembershipActive(m)).length;
    const inactiveCount = totalCount - activeCount;

    return (
        <AdminPageShell
            title="Leden Overzicht"
            backHref="/beheer"
            actions={
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-4 rounded-2xl border border-(--beheer-border)/50 bg-(--beheer-card-soft) px-4 py-2 shadow-sm md:flex">
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Totaal</span>
                            <span className="text-sm leading-none font-bold text-(--beheer-text)">{totalCount}</span>
                        </div>
                        <div className="h-6 w-px bg-(--beheer-border)/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Actief</span>
                            <span className="text-sm leading-none font-bold text-(--beheer-active)">{activeCount}</span>
                        </div>
                        <div className="h-6 w-px bg-(--beheer-border)/20" />
                        <div className="flex flex-col items-center px-2">
                            <span className="mb-1 text-[10px] leading-none font-semibold text-(--beheer-text-muted)">Verlopen</span>
                            <span className="text-sm leading-none font-bold text-(--beheer-inactive)">{inactiveCount}</span>
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
