import { Suspense } from 'react';
import AdminUnauthorized from '@/components/ui/admin/AdminUnauthorized';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { AlertCircle, ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LedenOverzichtIsland from '@/components/islands/admin/leden/LedenOverzichtIsland';
import MemberListSkeleton from '@/components/ui/admin/leden/MemberListSkeleton';
import { getSystemDirectus } from '@/lib/directus';
import { getImageUrl } from '@/lib/image-utils';
import { readUsers, readRoles } from '@directus/sdk';
import { isSuperAdmin, isMemberAdmin } from '@/lib/auth-utils';

const EXCLUDED_EMAILS = [
    'youtube@salvemundi.nl',
    'github@salvemundi.nl',
    'intern@salvemundi.nl',
    'ik.ben.de.website@salvemundi.nl',
    'voorzitter@salvemundi.nl',
    'twitch@salvemundi.nl',
    'secretaris@salvemundi.nl',
    'penningmeester@salvemundi.nl',
    'noreply@salvemundi.nl',
    'extern@salvemundi.nl',
    'commissaris.administratie@salvemundi.nl',
    'apibot@salvemundi.nl'
];

export default async function LedenPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ tab?: string }> 
}) {
    const params = await searchParams;
    const tab = (params.tab as 'active' | 'inactive') || 'active';

    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <Suspense key={tab} fallback={<MemberListSkeleton />}>
                <LedenDataLoader 
                    tab={tab} 
                />
            </Suspense>
        </div>
    );
}

async function LedenDataLoader({ tab }: { tab: 'active' | 'inactive' }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    
    if (!session || !session.user) return <AdminUnauthorized />;

    const user = session.user as any;
    const hasPriv = isMemberAdmin(user.committees);

    if (!hasPriv) {
        return (
            <AdminUnauthorized 
                title="Leden Beheer"
                description="Je hebt geen rechten om (persoons)gegevens van leden te bekijken. Dit is een beperkte sectie voor het Bestuur en ICT."
            />
        );
    }

    let members: any[] = [];
    let totalCount = 0;

    try {
        // Simple filter first to avoid operator issues on directus_users
        const query: any = {
            fields: ['id', 'first_name', 'last_name', 'email', 'membership_expiry', 'status'],
            limit: -1, // Fetch all members for counting and filtering
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
        console.error("Failed to fetch members:", e);
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-amber-700 dark:text-amber-400 flex items-center gap-4">
                    <AlertCircle className="h-6 w-6 shrink-0" />
                    <div>
                        <h2 className="font-bold">Ledenlijst kon niet volledig worden geladen</h2>
                        <p className="text-sm opacity-90">Controleer de Directus permissies of probeer het later opnieuw.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LedenOverzichtIsland 
            members={members as any} 
            totalCount={totalCount} 
            searchQuery=""
        />
    );
}


