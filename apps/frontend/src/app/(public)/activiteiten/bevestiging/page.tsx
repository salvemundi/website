import { notFound } from 'next/navigation';
import ConfirmationIsland from '@/components/islands/activities/ConfirmationIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

import { getSignupStatus } from '@/server/actions/events/public-activiteit-status.actions';
import { type SignupData } from '@/components/islands/activities/ConfirmationIsland';


export default async function ActiviteitenConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const session = await getEnrichedSession();

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
                    initialData={initialStatusRes.signup as SignupData}
                />
            </div>
        </div>
    );
}

