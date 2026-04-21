import { notFound } from 'next/navigation';
import ConfirmationIsland from '@/components/islands/membership/ConfirmationIsland';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';
import { getTransactionStatusAction } from '@/server/actions/membership.actions';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string; type?: string }>;
}

/**
 * LidmaatschapConfirmationPage: Modernised Confirmation Flow.
 * Swapped from activity-based island to dedicated membership island.
 * Uses Nuclear SSR to fetch initial status server-side for Zero-Drift.
 */
export default async function LidmaatschapConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t, type } = await searchParams;
    const identifier = t || transaction_id || id;

    if (!identifier) notFound();

    const session = await auth.api.getSession({
        headers: await headers()
    });

    // NUCLEAR SSR: Fetch initial status server-side to prevent layout shift
    const initialStatusRes = await getTransactionStatusAction(identifier);

    return (
        <div className="pt-8 w-full flex justify-center items-center min-h-[60vh]">
            <h1 className="sr-only">Lidmaatschap Bevestiging</h1>
            <div className="container mx-auto px-4 max-w-4xl flex justify-center">
                <ConfirmationIsland 
                    transactionId={identifier}
                    type={type || null}
                    initialStatus={initialStatusRes.status as any}
                    initialUserId={initialStatusRes.user_id}
                />
            </div>
        </div>
    );
}
