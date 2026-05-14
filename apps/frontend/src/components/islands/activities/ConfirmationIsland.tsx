'use client';

import { useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { getSignupStatus, type PaymentStatus } from '@/server/actions/events/public-activiteit-status.actions';
import StatusLoading from './confirmation/StatusLoading';
import StatusPaidMembership from './confirmation/StatusPaidMembership';
import StatusPaidActivity from './confirmation/StatusPaidActivity';
import StatusFailed from './confirmation/StatusFailed';
import StatusPending from './confirmation/StatusPending';

interface ConfirmationIslandProps {
    initialId?: string;
    initialTransactionId?: string;
    isLoggedIn?: boolean;
}

export interface SignupData {
    errorType?: 'canceled' | 'failed' | 'expired' | 'timeout';
    amount_tickets?: number;
    tickets?: Array<{ qr_token: string | null }>;
    qr_token?: string | null;
    id?: string | number | null;
    event_id?: { id?: string | number; name: string; custom_url?: string };
    custom_url?: string;
}

export default function ConfirmationIsland({
    initialId,
    initialTransactionId,
    isLoggedIn = false,
    initialStatus = 'loading',
    initialData = null
}: ConfirmationIslandProps & { initialStatus?: 'loading' | PaymentStatus | 'timeout', initialData?: SignupData | null }) {
    const [status, setStatus] = useState<'loading' | PaymentStatus | 'timeout'>(initialStatus);
    const [signupData, setSignupData] = useState<SignupData | null>(initialData);
    const [isMembership, setIsMembership] = useState(false);
    const [isTrip, setIsTrip] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (status === 'paid' || status === 'failed') return;

        const checkStatus = async () => {
            try {
                const res = await getSignupStatus(initialId, initialTransactionId);

                if (res.status === 'paid') {
                    setSignupData(res.signup as SignupData);
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setStatus('paid');
                } else if (res.status === 'canceled') {
                    setStatus('failed');
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setSignupData(prev => ({
                        ...prev,
                        ...(res.signup as SignupData),
                        errorType: 'canceled'
                    }));
                } else if (res.status === 'failed' || res.status === 'expired') {
                    setStatus('failed');
                    setIsMembership(!!res.isMembership);
                    setIsTrip(!!res.isTrip);
                    setSignupData(prev => ({
                        ...prev,
                        ...(res.signup as SignupData),
                        errorType: res.status as 'failed' | 'expired'
                    }));
                } else if (retryCount < 60) {
                    setTimeout(() => setRetryCount(prev => prev + 1), 1000);
                } else {
                    setStatus('timeout');
                    setSignupData({ errorType: 'timeout' });
                }
            } catch {
                setStatus('failed');
            }
        };

        checkStatus();
    }, [initialId, initialTransactionId, retryCount, status]);

    useEffect(() => {
        if (status === 'paid' && !isMembership && !isTrip) {
            const customUrl = signupData?.event_id?.custom_url || signupData?.custom_url;
            if (customUrl) {
                const timeout = setTimeout(() => {
                    window.location.href = customUrl;
                }, 3000);
                return () => clearTimeout(timeout);
            }
        }
    }, [status, signupData, isMembership, isTrip]);

    const downloadTicket = async (elementId: string, ticketName: string) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const dataUrl = await toPng(element, {
                quality: 0.95,
                backgroundColor: '#121212',
                style: { borderRadius: '0' }
            });

            const link = document.createElement('a');
            link.download = `Ticket-${ticketName.replace(/\s+/g, '-')}-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
        } catch {
            // Silent catch to comply with project policies
        }
    };

    const renderContent = () => {
        if (status === 'loading') {
            return <StatusLoading />;
        }

        if (status === 'paid') {
            if (isMembership) {
                return <StatusPaidMembership />;
            }

            return (
                <StatusPaidActivity
                    signupData={signupData}
                    isLoggedIn={isLoggedIn}
                    downloadTicket={downloadTicket}
                />
            );
        }

        if (status === 'failed') {
            return (
                <StatusFailed
                    signupData={signupData}
                    isMembership={isMembership}
                    isTrip={isTrip}
                />
            );
        }

        return (
            <StatusPending
                signupData={signupData}
                initialId={initialId}
                isLoggedIn={isLoggedIn}
            />
        );
    };

    return renderContent();
}