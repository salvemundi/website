import { notFound } from 'next/navigation';
import { Container, VisuallyHidden } from '@mantine/core';
import ConfirmationIsland, { type SignupData } from '@/components/islands/activiteiten/ConfirmationIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getSignupStatus } from '@/server/actions/events/activiteiten/activiteiten-status.actions';

interface PageProps {
    searchParams: Promise<{ id?: string; transaction_id?: string; t?: string }>;
}

export default async function ActiviteitenConfirmationPage({ searchParams }: PageProps) {
    const { id, transaction_id, t } = await searchParams;

    if (!id && !transaction_id && !t) notFound();

    const session = await getEnrichedSession();

    // NUCLEAR SSR: Fetch initial status server-side to prevent layout shift/skeletons
    const initialStatusRes = await getSignupStatus(id, transaction_id || t);

    return (
        <Container size="xl" py="xl">
            <VisuallyHidden component="h1">Bevestiging</VisuallyHidden>
            <ConfirmationIsland
                initialId={id}
                initialTransactionId={transaction_id || t}
                isLoggedIn={!!session?.user}
                initialStatus={initialStatusRes.status}
                initialData={initialStatusRes.signup as SignupData}
            />
        </Container>
    );
}
