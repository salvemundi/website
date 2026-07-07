'use client';

import React, { useState, useTransition } from 'react';
import { signupForActivity } from '@/server/actions/events/activiteiten/activiteiten-public.actions';
import { type EventSignupForm } from '@salvemundi/validations/schema/activity.zod';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { type EnrichedUser } from '@/types/auth';
import { safeConsoleError } from '@/server/utils/logger';

import StatusSignedUp from './signup/StatusSignedUp';
import StatusPast from './signup/StatusPast';
import StatusDeadlinePassed from './signup/StatusDeadlinePassed';
import SignupFormContent from './signup/SignupFormContent';

interface ActiviteitSignupIslandProps {
    id?: number | string;
    isPast?: boolean;
    isDeadlinePassed?: boolean;
    eventId?: number;
    price?: number;
    eventDate?: string;
    description?: string;
    eventName?: string;
    initialUser?: EnrichedUser | null;
    verifiedPaymentStatus?: 'paid' | 'open' | 'failed' | 'canceled' | null;
    initialQrToken?: string;
    initialIsSignedUp?: boolean;
    isMembersOnly?: boolean;
    isMember?: boolean;
}

export default function ActiviteitSignupIsland({
    eventId = 0,
    price = 0,
    isPast: serverIsPast = false,
    isPast: clientIsPast = false,
    isDeadlinePassed = false,
    eventName = 'Activiteit',
    initialUser,
    verifiedPaymentStatus,
    initialQrToken,
    initialIsSignedUp = false,
    id,
    isMembersOnly = false,
    isMember = false
}: ActiviteitSignupIslandProps) {
    const user = initialUser;

    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const [signupStatus, setSignupStatus] = useState<{
        isSignedUp: boolean;
        paymentStatus?: 'paid' | 'open' | 'failed' | 'canceled';
        qrToken?: string;
        signupId?: number;
    }>({
        isSignedUp: initialIsSignedUp || verifiedPaymentStatus === 'paid' || verifiedPaymentStatus === 'open',
        paymentStatus: verifiedPaymentStatus || undefined,
        qrToken: initialQrToken,
        signupId: typeof id === 'number' ? id : (id && !isNaN(Number(id)) ? Number(id) : undefined)
    });

    const isPaid = price > 0;
    const isPast = serverIsPast || clientIsPast;

    const onSubmit = async (data: EventSignupForm) => {
        setServerError(null);

        startTransition(async () => {
            const result = await signupForActivity(data);

            if (result.success) {
                if (result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else if ('signupId' in result && result.signupId && 'qrToken' in result && result.qrToken) {
                    window.location.href = `/activiteiten/bevestiging?id=${result.signupId}&transactionId=${result.qrToken}`;
                } else {
                    setSignupStatus({
                        isSignedUp: true,
                        paymentStatus: isPaid ? 'open' : 'paid',
                        signupId: 'signupId' in result ? Number(result.signupId) : undefined
                    });
                }
            } else {
                setServerError(result.error || 'Er is iets misgegaan.');
            }
        });
    };

    if (signupStatus.isSignedUp && (signupStatus.paymentStatus === 'paid' || signupStatus.paymentStatus === 'open')) {
        const isPaidStatus = signupStatus.paymentStatus === 'paid';

        const handleRetry = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const signupId = signupStatus.signupId || Number(urlParams.get('id'));

            if (!signupId || isNaN(signupId)) {
                setServerError("Kon aanmeldings-ID niet vinden voor herbetaling.");
                return;
            }

            try {
                const { retryActivityPayment } = await import('@/server/actions/events/activiteiten/activiteiten-status.actions');
                const result = await retryActivityPayment(signupId);
                if (result.success && result.checkoutUrl) {
                    window.location.href = result.checkoutUrl;
                } else {
                    setServerError(result.error || "Herbetaling mislukt.");
                }
            } catch (error) {
                safeConsoleError('[ActiviteitSignupIsland.tsx][ActiviteitSignupIsland] ', error);
                setServerError("Er is een fout opgetreden bij het herstarten van de betaling.");
            }
        };

        return (
            <StatusSignedUp
                isPaidStatus={isPaidStatus}
                eventName={eventName}
                qrToken={signupStatus.qrToken}
                onRetry={() => { void handleRetry(); }}
                serverError={serverError}
            />
        );
    }

    if (isPast) {
        return <StatusPast />;
    }

    if (isDeadlinePassed) {
        return <StatusDeadlinePassed />;
    }

    if (isMembersOnly && !isMember) {
        return (
            <div className="rounded-2xl border border-(--border-color) bg-(--bg-card) p-6 text-center shadow-card">
                <h3 className="text-lg font-semibold text-(--text-main)">
                    Exclusief voor leden
                </h3>
                <p className="mt-2 text-sm text-(--text-muted)">
                    Deze activiteit is speciaal voor onze leden. Log in om je in te schrijven. Heb je nog geen account? Word dan lid en doe gezellig mee!
                </p>
                <a
                    href="/lidmaatschap"
                    className="mt-4 inline-block rounded-xl bg-(--theme-purple) px-6 py-3 text-sm font-bold text-white uppercase tracking-widest transition-opacity hover:opacity-90"
                >
                    Word lid van Salve Mundi
                </a>
            </div>
        );
    }

    return (
        <SignupFormContent
            onSubmit={(data) => { void onSubmit(data); }}
            isPending={isPending}
            price={price}
            initialData={{
                event_id: eventId,
                name: user?.name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : ''),
                email: user?.email || '',
                phoneNumber: formatPhoneNumber(user?.phone_number || '')
            }}
            serverError={serverError}
        />
    );
}