'use client';

import { useState } from 'react';
import { createPaymentAction } from '@/shared/api/finance-actions';
import { DeletionTimer } from './DeletionTimer';

interface RenewalSectionProps {
    baseAmount: number;
    user: {
        id: string;
        first_name: string;
        membership_expiry?: string;
        email: string;
    };
}

export const RenewalSection = ({ baseAmount, user }: RenewalSectionProps) => {
    const [isProcessing, setIsProcessing] = useState(false);

    const handleRenewal = async () => {
        setIsProcessing(true);
        const traceId = Math.random().toString(36).substring(7);

        try {
            const payload = {
                amount: baseAmount.toFixed(2),
                description: 'Verlenging Contributie Salve Mundi',
                redirectUrl: window.location.origin + '/lidmaatschap/bevestiging?type=renewal',
                isContribution: true,
                userId: user.id,
                email: user.email,
            };

            const result = await createPaymentAction(payload, traceId);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else if (result.success && result.paymentId) {
                // Free/direct renewal
                window.location.href = payload.redirectUrl;
            } else {
                alert(`Er ging iets mis: ${result.error || 'Onbekende fout'}`);
                setIsProcessing(false);
            }
        } catch (error) {
            console.error('Renewal failed:', error);
            alert('Kon betaling niet starten.');
            setIsProcessing(false);
        }
    };

    return (
        <div className="text-theme-text">
            {user.membership_expiry && <DeletionTimer expiryDateStr={user.membership_expiry} />}

            <div className="mb-6">
                <p className="mb-2 text-2xl font-bold text-theme-purple">
                    Welkom terug, {user.first_name}.
                </p>
                <p className="text-theme-text-subtle text-lg leading-relaxed">
                    Je lidmaatschap is verlopen. Om weer toegang te krijgen tot alle activiteiten en je account te behouden, vragen we je de jaarlijkse contributie te voldoen.
                </p>
            </div>

            <div className="bg-theme-purple/5 border border-theme-purple/10 rounded-2xl p-6 mb-8">
                <p className="text-sm font-bold text-theme-purple uppercase tracking-widest mb-4">Verlenging</p>
                <button
                    onClick={handleRenewal}
                    disabled={isProcessing}
                    className="form-button shadow-glow transition-transform active:scale-95"
                >
                    {isProcessing ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>Verwerken...</span>
                        </>
                    ) : (
                        `Nu Verlengen (€${baseAmount.toFixed(2).replace('.', ',')})`
                    )}
                </button>
            </div>
        </div>
    );
};
