'use client';

import { useState } from 'react';
import { AlertCircle, CreditCard } from 'lucide-react';
import { initiateFinalPayment } from '@/server/actions/public/webshop-checkout.actions';
import { safeConsoleError } from '@/server/utils/logger';
import { type PreorderWithLines } from '@/server/internal/webshop-db.utils';

interface WebshopFinalPaymentIslandProps {
    preorder: PreorderWithLines;
    token?: string;
}

export default function WebshopFinalPaymentIsland({ preorder, token }: WebshopFinalPaymentIslandProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const remaining = Number(preorder.subtotal_amount) - Number(preorder.deposit_amount);

    const handlePay = async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await initiateFinalPayment(preorder.id, token);
            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
                return;
            }

            setError(result.error || 'Betaalsessie starten mislukt.');
            setLoading(false);
        } catch (err) {
            safeConsoleError('[WebshopFinalPaymentIsland.tsx][handlePay]', err);
            setError('Er is een onverwachte fout opgetreden.');
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                {preorder.lines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between border-b border-(--border-color) pb-3">
                        <div>
                            <p className="font-bold text-(--theme-purple)/90">{line.product_name_snapshot}</p>
                            {line.variant_label_snapshot && (
                                <p className="text-sm text-(--text-muted)">{line.variant_label_snapshot} &middot; {line.quantity}x</p>
                            )}
                        </div>
                        <span className="font-bold text-(--theme-purple)/80">€{(Number(line.unit_price) * line.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            <div className="rounded-2xl bg-(--bg-soft) p-4 flex items-center justify-between">
                <span className="font-bold text-(--theme-purple)/90">Restbetaling &mdash; resterend bedrag van je preorder</span>
                <span className="text-xl font-bold text-(--theme-purple)">€{remaining.toFixed(2)}</span>
            </div>

            {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-xs">{error}</p>
                </div>
            )}

            <button
                type="button"
                onClick={() => void handlePay()}
                disabled={loading}
                className={`form-button w-full flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
                <CreditCard className="w-5 h-5" />
                {loading ? 'Verwerken...' : 'Restbetaling voldoen'}
            </button>
        </div>
    );
}
