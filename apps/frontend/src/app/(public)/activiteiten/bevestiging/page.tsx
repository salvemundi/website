import { notFound } from 'next/navigation';
import ConfirmationIsland from '@/components/islands/activities/ConfirmationIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

import { getSignupStatus } from '@/server/actions/activiteit-actions';

export default async function ActiviteitenConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const session = await auth.api.getSession({
        headers: await headers()
    });

    // NUCLEAR SSR: Fetch initial status server-side to prevent layout shift/skeletons
    const initialStatusRes = await getSignupStatus(id, transaction_id || t);

    return (
        <div className="pt-8 w-full">
            <h1 className="sr-only">Bevestiging</h1>
            <div className="container mx-auto px-4 max-w-7xl">
                <ConfirmationIsland 
                    initialId={id} 
                    initialTransactionId={transaction_id || t} 
                    isLoggedIn={!!session?.user} 
                    initialStatus={initialStatusRes.status}
                    initialData={initialStatusRes.signup as any}
                />
            </div>
        </div>
    );
}

