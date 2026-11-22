'use client';

import { useState } from 'react';
import type { Trip } from '@salvemundi/validations/schema/beheer-trip.zod';
import type { TripSignup } from '@salvemundi/validations/schema/trip.zod';
import { authClient } from '@/lib/auth';
import { ReisSignupStatus } from './ReisSignupStatus';
import { ReisRegistrationForm } from './ReisRegistrationForm';
import { RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ActionIcon, Card, Group, Stack, Title } from '@mantine/core';
import { revalidateReisAction } from '@/server/actions/events/reis/reis-public.actions';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

interface ReisFormIslandProps {
    isSignedUp?: boolean;
    isReisDisabled?: boolean;
    nextTrip: Trip | null;
    userSignup: TripSignup | null;
    canSignUp: boolean;
    registrationStartText: string;
    participantsCount: number;
    initialUser?: EnrichedUser | null;
    termsFileUrl?: string | null;
}

export function ReisFormIsland({
    nextTrip,
    userSignup,
    canSignUp,
    registrationStartText,
    initialUser,
    termsFileUrl
}: ReisFormIslandProps) {
    const { data: session } = authClient.useSession();
    const router = useRouter();

    const currentUser = (initialUser || session?.user || null) as EnrichedUser | null;

    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await revalidateReisAction();
            await authClient.getSession();
            router.refresh();
        } catch (error) {
            safeConsoleError('[ReisFormIsland.tsx][ReisFormIsland] ', error);
        } finally {
            setTimeout(() => setRefreshing(false), 800);
        }
    };

    return (
        <Card padding="xl" shadow="xl" withBorder w={{ base: '100%', lg: '50%' }}>
            <Stack gap="lg">
                <Group justify="space-between" align="center" gap="md">
                    <Title order={2} size="h2" c="brand">
                        {nextTrip?.name || 'Inschrijven'}
                    </Title>
                    <ActionIcon
                        type="button"
                        size="xl"
                        onClick={() => { void handleRefresh(); }}
                        disabled={refreshing}
                        title="Gegevens vernieuwen"
                        aria-label="Gegevens vernieuwen"
                    >
                        <RefreshCcw size={18} className={refreshing ? 'animate-spin' : undefined} />
                    </ActionIcon>
                </Group>

                {userSignup ? (
                    <ReisSignupStatus
                        userSignup={userSignup}
                        nextTrip={nextTrip}
                        error={null}
                    />
                ) : (
                    <ReisRegistrationForm
                        nextTrip={nextTrip}
                        canSignUp={canSignUp}
                        registrationStartText={registrationStartText}
                        currentUser={currentUser}
                        onRefresh={() => { void handleRefresh(); }}
                        termsFileUrl={termsFileUrl}
                    />
                )}
            </Stack>
        </Card>
    );
}
