import { notFound } from 'next/navigation';
import { Center, Container, VisuallyHidden } from '@mantine/core';
import ConfirmationIsland from '@/components/islands/membership/ConfirmationIsland';
import { getTransactionStatusAction } from '@/server/actions/profile/membership.actions';

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

    // NUCLEAR SSR: Fetch initial status server-side to prevent layout shift
    const initialStatusRes = await getTransactionStatusAction(identifier);

    return (
        <Container size="md" py="xl">
            <VisuallyHidden component="h1">Lidmaatschap Bevestiging</VisuallyHidden>
            <Center mih="60vh">
                <ConfirmationIsland
                    transactionId={identifier}
                    type={type || null}
                    initialStatus={initialStatusRes.status as 'paid' | 'open' | 'failed' | 'error'}
                    initialUserId={initialStatusRes.user_id}
                />
            </Center>
        </Container>
    );
}
