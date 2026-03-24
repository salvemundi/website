import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LedenDetailIsland from '@/components/islands/admin/leden/LedenDetailIsland';
import MemberDetailSkeleton from '@/components/ui/admin/leden/MemberDetailSkeleton';
import { getSystemDirectus } from '@/lib/directus';


// Correct Directus SDK imports
import { readUser, readItems as dReadItems } from '@directus/sdk';

export default async function LidDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <Suspense fallback={<MemberDetailSkeleton />}>
                <LidDataLoader id={resolvedParams.id} />
            </Suspense>
        </div>
    );
}

async function LidDataLoader({ id }: { id: string }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <UnauthorizedAccess />;

    const user = session.user as any;
    const memberships = user.committees || [];
    const hasPriv = memberships.some((c: any) => {
        const name = (c?.name || '').toString().toLowerCase();
        return name.includes('bestuur') || name.includes('ict') || name.includes('kandi');
    });

    if (!hasPriv) return <UnauthorizedAccess />;

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
                limit: 50
            })
        );
    } catch (e: any) {
        console.error("[LidDataLoader] Failed to fetch committees:", e.message, e?.errors || e);
    }

    // Fetch Activity History (Signups)
    let signups: any[] = [];
    try {
        signups = await getSystemDirectus().request(
            dReadItems<any, any, any>('event_signups', {
                filter: { directus_relations: { _eq: id } },
                // Limit fields to those known to work with system token (based on activities.actions.ts)
                fields: ['id', 'payment_status', { event_id: ['id', 'name', 'event_date'] }],
                limit: 20
            })
        );
    } catch (e: any) {
        console.error("[LidDataLoader] Failed to fetch signups:", e.message, e?.errors || e);
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
            console.error("[LidDataLoader] Failed to fetch all committees:", e.message, e?.errors || e);
        }
    }

    return (
        <>
            <PageHeader
                title={`${member.first_name} ${member.last_name}`}
                description="Beheer profiel, lidmaatschappen en historie"
                backLink="/beheer/leden"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />
            <LedenDetailIsland 
                member={member as any} 
                initialMemberships={userCommittees as any} 
                signups={signups as any}
                allCommittees={allCommittees as any}
                isAdmin={hasPriv}
            />
        </>
    );
}

function UnauthorizedAccess() {
    return (
        <>
            <PageHeader title="Geen Toegang" description="Onvoldoende rechten" backLink="/beheer/leden" />
            <div className="container mx-auto px-4 py-12 max-w-2xl">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center ring-1 ring-slate-200 dark:ring-slate-700">
                    <div className="mb-6 flex justify-center">
                        <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                            <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Toegang Geweigerd</h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
                        Je hebt geen rechten om persoonsgegevens van dit lid te bekijken.
                    </p>
                    <div className="flex justify-center">
                        <Link href="/beheer/leden" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-8 py-3 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                            <ArrowLeft className="h-5 w-5" /> Terug naar Overzicht
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}
