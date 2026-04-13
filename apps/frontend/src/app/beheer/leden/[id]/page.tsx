import { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { UserCircle } from 'lucide-react';
import { notFound } from 'next/navigation';
import LedenDetailIsland from '@/components/islands/admin/leden/LedenDetailIsland';
import AdminToolbar from '@/components/ui/admin/AdminToolbar';
import { getSystemDirectus } from '@/lib/directus';

// Correct Directus SDK imports
import { readUser, readItems as dReadItems } from '@directus/sdk';

import { AdminGenericLoading } from '@/components/ui/admin/AdminLoadingFallbacks';
import AdminPageShell from '@/components/ui/admin/AdminPageShell';

export default async function LidDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    
    return (
        <AdminPageShell
            title="Lid Detail"
            backHref="/beheer/leden"
            fallback={<AdminGenericLoading />}
        >
            <Suspense fallback={<AdminGenericLoading />}>
                <LidDataLoader id={resolvedParams.id} />
            </Suspense>
        </AdminPageShell>
    );
}

async function LidDataLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <AdminUnauthorized title="Lid Detail" />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    if (!hasPriv) {
        return (
            <AdminUnauthorized 
                title="Lid Detail"
                description="Je hebt geen rechten om persoonsgegevens van dit lid te bekijken. Dit is een beperkte sectie voor het Bestuur en ICT."
            />
        );
    }

    // Fetch Member Data
    let member;
    try {
        member = await getSystemDirectus().request(
            readUser<any, any>(id, {
                fields: ['id', 'first_name', 'last_name', 'email', 'date_of_birth', 'membership_expiry', 'status', 'phone_number', 'avatar', 'entra_id']
            })
        );
    } catch (e) {
        return notFound();
    }

    if (!member) return notFound();

    // Fetch Committee Memberships
    let userCommittees: any[] = [];
    try {
        userCommittees = await getSystemDirectus().request(
            dReadItems<any, any, any>('committee_members' as any, {
                filter: { user_id: { _eq: id } },
                fields: ['id', 'is_leader', { committee_id: ['id', 'name', 'email', 'azure_group_id', 'is_visible'] }],
                limit: -1
            })
        );
    } catch (e: any) {
        
    }

    // Fetch Activity History (Signups) via email
    let signups: any[] = [];
    try {
        signups = await getSystemDirectus().request(
            dReadItems<any, any, any>('event_signups', {
                filter: { participant_email: { _eq: member.email } },
                fields: ['id', 'payment_status', { event_id: ['id', 'name', 'event_date'] }],
                limit: -1
            })
        );
    } catch (e: any) {
        
    }

    let allCommittees: any[] = [];
    if (hasPriv) {
        try {
            allCommittees = await getSystemDirectus().request(
                dReadItems<any, any, any>('committees', {
                    fields: ['id', 'name', 'azure_group_id', 'is_visible'],
                    sort: ['name'],
                    limit: -1
                })
            );
        } catch (e: any) {
            
        }
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <LedenDetailIsland 
                member={member as any} 
                initialMemberships={userCommittees as any} 
                signups={signups as any}
                allCommittees={allCommittees as any}
                isAdmin={hasPriv}
            />
        </div>
    );
}


