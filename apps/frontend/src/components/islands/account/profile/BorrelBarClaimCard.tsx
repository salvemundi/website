'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { Gift, CheckCircle2, Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { claimBorrelBarLink, type BorrelBarClaimStatus } from '@/server/actions/profile/borrelbar-claim.actions';
import { getImageUrl } from '@/lib/utils/image-utils';

interface BorrelBarClaimCardProps {
    initialStatus?: BorrelBarClaimStatus;
}

export default function BorrelBarClaimCard({ initialStatus }: BorrelBarClaimCardProps) {
    const [status, setStatus] = useState<BorrelBarClaimStatus | undefined>(initialStatus);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    if (!status?.isActive) return null;

    const handleClaim = () => {
        setError(null);
        startTransition(async () => {
            const res = await claimBorrelBarLink();
            if (res.success) {
                setStatus((prev) => prev ? { ...prev, hasClaimed: true, passUrl: res.passUrl ?? prev.passUrl } : prev);
                if (res.passUrl) {
                    window.open(res.passUrl, '_blank', 'noopener,noreferrer');
                }
            } else {
                setError(res.error || 'Er is een fout opgetreden bij het claimen.');
            }
        });
    };

    const hasClaimed = status.hasClaimed;
    const passUrl = status.passUrl;
    const logoUrl = status.logoImageId ? getImageUrl(status.logoImageId, { width: 96, height: 96, fit: 'inside' }) : null;

    return (
        <div className="flex flex-col gap-1.5 sm:col-span-2">
            <div className="flex h-6 items-center pl-1">
                <p className="text-left text-[11px] font-black tracking-wider text-licht-paars uppercase dark:text-geel">
                    BorrelBar Voordeel
                </p>
            </div>

            <div className="squircle flex min-h-17 flex-col gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex shrink-0 items-center justify-center text-purple-600 dark:text-purple-300">
                        {logoUrl ? (
                            <div className="relative size-6 overflow-hidden rounded-md">
                                <Image
                                    src={logoUrl}
                                    alt="BorrelBar Logo"
                                    fill
                                    sizes="24px"
                                    className="object-contain"
                                />
                            </div>
                        ) : (
                            <Gift className="size-5" />
                        )}
                    </div>
                    <div className="flex flex-col">
                        <p className="text-sm font-bold text-purple-700 dark:text-white">
                            BorrelBar pas claimen
                        </p>
                        <p className="text-xs text-purple-600/70 dark:text-white/60">
                            {hasClaimed
                                ? 'Je hebt jouw eenmalige registratie al geclaimd.'
                                : 'Claim je eenmalige Wallet registratie (1x per lid).'}
                        </p>
                    </div>
                </div>

                <div className="flex shrink-0 items-center">
                    {hasClaimed ? (
                        passUrl ? (
                            <a
                                href={passUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="squircle form-button flex items-center justify-center gap-2 bg-purple-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-purple-700 active:scale-95 dark:bg-purple-500 dark:hover:bg-purple-600"
                            >
                                <span>Bekijk Pas</span>
                                <ExternalLink className="size-3.5" />
                            </a>
                        ) : (
                            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="size-4 shrink-0" />
                                <span>Al geclaimd</span>
                            </div>
                        )
                    ) : (
                        <button
                            onClick={handleClaim}
                            disabled={isPending}
                            className="squircle form-button flex w-full items-center justify-center gap-2 bg-purple-600 px-5 py-2.5 text-xs font-extrabold text-white transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50 sm:w-auto dark:bg-purple-500 dark:hover:bg-purple-600"
                            type="button"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Bezig met activeren...</span>
                                </>
                            ) : (
                                <>
                                    <span>Claimen</span>
                                    <ExternalLink className="size-3.5" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-2.5 text-xs font-bold text-red-600 dark:text-red-400">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>{error}</span>
                </div>
            )}
        </div>
    );
}
