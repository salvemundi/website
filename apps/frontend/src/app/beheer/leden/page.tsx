import { Suspense } from 'react';
import PageHeader from '@/components/ui/layout/PageHeader';
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
import { isSuperAdmin } from '@/lib/auth-utils';

const PAGE_SIZE = 25;

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
    searchParams: Promise<{ search?: string; page?: string; tab?: string }> 
}) {
    const params = await searchParams;
    const page = parseInt(params.page || '1');
    const search = params.search || '';
    const tab = (params.tab as 'active' | 'inactive') || 'active';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            <PageHeader
                title="Leden Overzicht"
                description="Beheer alle Salve Mundi leden inclusief lidmaatschappen"
                backLink="/beheer"
                className="mb-0"
                contentPadding="pt-0 pb-2 sm:pt-0 sm:pb-2"
                titleClassName="text-sm sm:text-base md:text-xl"
            />
            <Suspense key={search + "-" + page + "-" + tab} fallback={<MemberListSkeleton />}>
                <LedenDataLoader 
                    search={search} 
                    page={page} 
                    tab={tab} 
                />
            </Suspense>
        </div>
    );
}

async function LedenDataLoader({ search, page, tab }: { search: string, page: number, tab: 'active' | 'inactive' }) {
    const session = await auth.api.getSession({
        headers: await headers()
    });
    if (!session || !session.user) return <UnauthorizedAccess />;

    const user = session.user as any;
    const hasPriv = isSuperAdmin(user.committees);

    if (!hasPriv) return <UnauthorizedAccess />;

    const todayStr = new Date().toISOString().substring(0, 10);

    let members: any[] = [];
    let totalCount = 0;

    try {
        // Simple filter first to avoid operator issues on directus_users
        const query: any = {
            fields: ['id', 'first_name', 'last_name', 'email', 'date_of_birth', 'membership_expiry', 'status'],
            limit: 200, // Fetch enough to avoid pagination issues for now
            sort: ['last_name', 'first_name'],
            filter: {
                _and: [
                    { email: { _nnull: true } },
                    { email: { _nin: EXCLUDED_EMAILS } }
                ]
            }
        };

        if (search) {
            query.filter._and.push({
                _or: [
                    { first_name: { _icontains: search } },
                    { last_name: { _icontains: search } },
                    { email: { _icontains: search } }
                ]
            });
        }

        const res = await getSystemDirectus().request(readUsers(query));
        
        if (Array.isArray(res)) {
            members = res;
            totalCount = res.length;
        }
    } catch (e: any) {
        console.error("Failed to fetch members:", e);
        // We still return so it doesn't crash the whole beheer dashboard, 
        // but we show a small error in the context.
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
            currentPage={page} 
            searchQuery={search}
            pageSize={PAGE_SIZE}
        />
    );
}

function UnauthorizedAccess() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-2xl">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 text-center ring-1 ring-slate-200 dark:ring-slate-700">
                <div className="mb-6 flex justify-center">
                    <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-6">
                        <ShieldAlert className="h-16 w-16 text-red-600 dark:text-red-400" />
                    </div>
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Toegang Geweigerd</h1>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
                    Je hebt geen rechten om (persoons)gegevens van leden te bekijken.
                </p>
                <div className="flex justify-center">
                    <Link href="/beheer" className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 px-8 py-3 font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all">
                        <ArrowLeft className="h-5 w-5" /> Terug naar Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
