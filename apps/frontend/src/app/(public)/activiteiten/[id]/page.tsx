import React, { Suspense } from 'react';
import { auth } from '@/server/auth/auth';
import { type DbEventSignup } from '@salvemundi/validations/directus/schema';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getActivityBySlug, checkUserSignupStatus, getSignupStatus } from '@/server/actions/activiteit-actions';
import ActivityDetailIsland from '@/components/islands/activities/ActivityDetailIsland';
import EventSignupIsland from '@/components/islands/activities/EventSignupIsland';
import { type MembershipUserData } from '@/components/islands/account/MembershipStatusIsland';
import { type EnrichedUser } from '@/types/auth';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import BackButton from '@/components/ui/navigation/BackButton';



interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ status?: string; token?: string }>;
}

import { connection } from 'next/server';

export default async function PageActivityId({ params, searchParams }: PageProps) {
    await connection();
    return (
        <PublicPageShell>
            <ActivityContent params={params} searchParams={searchParams} />
        </PublicPageShell>
    );
}


async function ActivityContent({ params, searchParams }: PageProps) {
    const { id: rawId } = await params;
    const sParams = await searchParams;

    // Extract real ID or use slug
    // Try By Slug first (which handles id, id-slug, and custom_url)
    const [activity, session] = await Promise.all([
        getActivityBySlug(rawId),
        auth.api.getSession({
            headers: await headers()
        })
    ]);

    if (!activity) notFound();

    const isPast = new Date(activity.datum_start) < new Date();

    // Server-side authoritative price determination
    const user = session?.user as MembershipUserData | undefined;
    const isMember = user?.membership_status === 'active';
    const price = isMember ? (activity.price_members ?? 0) : (activity.price_non_members ?? 0);

    // Server-side payment verification
    let verifiedPaymentStatus: 'paid' | 'open' | 'failed' | 'canceled' | null = null;
    let qrToken: string | undefined = undefined;
    let isSignedUp = false;

    let signupId: number | undefined = undefined;
    if (user?.email) {
        const signupStatus = await checkUserSignupStatus(Number(activity.id), user.email, user.id);
        if (signupStatus.isSignedUp) {
            isSignedUp = true;
            qrToken = signupStatus.qrToken;
            verifiedPaymentStatus = signupStatus.paymentStatus as 'paid' | 'open' | 'failed' | 'canceled' | null;
            signupId = signupStatus.id;
        }
    }

    // Check by token if returning from payment
    if (sParams.token) {
        const statusRes = await getSignupStatus(undefined, sParams.token);
        if (statusRes.status === 'paid') {
            verifiedPaymentStatus = 'paid';
            qrToken = (statusRes.signup as DbEventSignup)?.qr_token || sParams.token;
            isSignedUp = true;
        }
    }

    return (
        <>
            <div className="container mx-auto px-4 max-w-7xl pt-8 pb-4">
                <BackButton href="/activiteiten" title="Terug naar activiteiten" />
            </div>

            <ActivityDetailIsland activity={activity} isLoggedIn={!!session}>
                <EventSignupIsland
                    eventId={Number(activity.id)}
                    price={price}
                    eventDate={activity.datum_start}
                    description={activity.beschrijving || ''}
                    isPast={isPast}
                    eventName={activity.titel}
                    initialUser={(session?.user as unknown as EnrichedUser) || null}
                    verifiedPaymentStatus={verifiedPaymentStatus}
                    initialQrToken={qrToken}
                    initialIsSignedUp={isSignedUp}
                    id={signupId}
                />
            </ActivityDetailIsland>
        </>
    );
}
