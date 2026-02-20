'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { PaymentStatus, PaymentStatusResponse } from '@/shared/lib/api/payment-types';

interface PaymentStatusDisplayProps {
    initialStatus: PaymentStatus;
    checkStatusAction: () => Promise<PaymentStatusResponse>;
    successContent: React.ReactNode;
    pendingContent: React.ReactNode;
    failedContent: React.ReactNode;
    pollingInterval?: number;
    maxAttempts?: number;
}

/**
 * A generic, "dumb" component for displaying and polling payment status.
 * Reusable across different payment flows (trips, webshop, memberships).
 */
export default function PaymentStatusDisplay({
    initialStatus,
    checkStatusAction,
    successContent,
    pendingContent,
    failedContent,
    pollingInterval = 5000,
    maxAttempts = 5
}: PaymentStatusDisplayProps) {
    const [status, setStatus] = useState<PaymentStatus>(initialStatus);
    const [attempts, setAttempts] = useState(0);
    const [isChecking, setIsChecking] = useState(false);
    const [showManualRefresh, setShowManualRefresh] = useState(false);

    // Use a ref to track if we've reached success to stop all polling/effects
    const isSuccess = useRef(initialStatus === 'SUCCESS');

    const checkStatus = useCallback(async (isManual = false) => {
        if (isChecking || isSuccess.current) return;

        setIsChecking(true);
        if (isManual) {
            setShowManualRefresh(false);
            // Don't reset attempts on manual, just perform the extra check
        }

        try {
            const result = await checkStatusAction();

            if (result.status === 'SUCCESS') {
                isSuccess.current = true;
                setStatus('SUCCESS');
                setShowManualRefresh(false);
            } else if (result.status === 'FAILED') {
                setStatus('FAILED');
                setShowManualRefresh(false);
            } else {
                // Still pending
                setStatus('PENDING');
                if (isManual) {
                    setShowManualRefresh(true);
                }
            }
        } catch (error) {
            console.error('[PaymentStatusDisplay] Error checking status:', error);
        } finally {
            setIsChecking(false);
        }
    }, [checkStatusAction, isChecking]);

    useEffect(() => {
        // Only start polling if we are pending and haven't shown manual refresh yet
        if (status === 'PENDING' && !showManualRefresh && attempts < maxAttempts && !isSuccess.current) {
            const timer = setTimeout(() => {
                setAttempts(prev => prev + 1);
                checkStatus();
            }, pollingInterval);

            return () => clearTimeout(timer);
        } else if (attempts >= maxAttempts && status === 'PENDING' && !isSuccess.current) {
            setShowManualRefresh(true);
        }
    }, [status, attempts, maxAttempts, pollingInterval, checkStatus, showManualRefresh]);

    // Render Success state
    if (status === 'SUCCESS' || isSuccess.current) {
        return <>{successContent}</>;
    }

    // Render Failed state
    if (status === 'FAILED') {
        return <>{failedContent}</>;
    }

    // Render Manual Refresh state (DoS prevention hit)
    if (showManualRefresh) {
        return (
            <div className="flex items-center justify-center py-12 px-4">
                <div className="text-center max-w-md w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-color)]">
                    <AlertCircle className="h-16 w-16 text-[var(--theme-warning)] mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Betaling wordt nog verwerkt</h2>
                    <p className="text-[var(--text-muted)] mb-6">
                        De betaling wordt nog verwerkt door onze systemen. Dit kan soms wat langer duren.
                    </p>
                    <div className="space-y-3">
                        <button
                            onClick={() => checkStatus(true)}
                            disabled={isChecking}
                            className="w-full px-6 py-3 bg-[var(--color-purple-600)] text-white rounded-lg hover:bg-[var(--color-purple-700)] transition font-medium flex items-center justify-center disabled:opacity-70"
                        >
                            {isChecking && <Loader2 className="h-5 w-5 animate-spin mr-2" />}
                            Opnieuw controleren
                        </button>
                        {pendingContent}
                    </div>
                </div>
            </div>
        );
    }

    // Render Initial/Polling state
    return (
        <div className="flex items-center justify-center py-12 px-4">
            <div className="text-center max-w-md w-full bg-[var(--bg-card)] p-8 rounded-xl shadow-lg border border-[var(--border-color)]">
                <Loader2 className="h-16 w-16 animate-spin text-[var(--color-purple-600)] mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-[var(--text-main)] mb-2">Betaling controleren...</h2>
                <p className="text-[var(--text-muted)]">
                    We controleren of je betaling is verwerkt. Dit duurt enkele seconden. (Poging {attempts + 1}/{maxAttempts})
                </p>
                <div className="mt-8">
                    {pendingContent}
                </div>
            </div>
        </div>
    );
}
