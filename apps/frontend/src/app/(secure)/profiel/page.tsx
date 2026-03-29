import { Suspense } from 'react';
import { headers } from 'next/headers';
import { getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profiel.actions';
import { checkAdminAccess } from '@/server/actions/admin.actions';

import { ProfielSkeleton } from '@/components/ui/account/ProfielSkeleton';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';

export default function ProfielPage() {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            <header className="bg-[var(--bg-soft)] py-12">
                <div className="mx-auto max-w-app px-4 text-center">
                    <h1 className="text-4xl font-extrabold text-[var(--text-main)]">Mijn Account</h1>
                    <p className="text-lg sm:text-xl text-[var(--color-purple-600)] dark:text-white max-w-3xl mt-4 font-medium mx-auto">
                        Beheer je gegevens, lidmaatschap en inschrijvingen.
                    </p>
                </div>
            </header>

            <main className="mx-auto max-w-app px-4 py-12">
                <Suspense fallback={<ProfielSkeleton />}>
                    <ProfielFetcher />
                </Suspense>
            </main>
        </div>
    );
}

async function ProfielFetcher() {
    const { user, impersonation } = await checkAdminAccess();
    
    // Fallback if somehow not authenticated (though proxy handles this)
    if (!user) return null;

    // Fetch user event signups and pub crawl signups
    const [signups, pubCrawlSignups] = await Promise.all([
        getUserEventSignups(user.id),
        getUserPubCrawlSignups(user.id)
    ]);
    
    return (
        <ProfielIsland 
            initialSignups={signups} 
            pubCrawlSignups={pubCrawlSignups}
            user={user as any} 
        />
    );
}
