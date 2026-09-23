'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileSignature, ShieldCheck, Clock, AlertTriangle, XCircle, Users, RefreshCw, Loader2 } from 'lucide-react';
import type { NdaCommitteeOverview } from '@/server/queries/nda/admin-nda.queries';
import type { NdaCommitteeMember } from '@/server/queries/nda/admin-nda.queries';
import { setNdaSecretary, setNdaSystemActive } from '@/server/actions/admin/nda/admin-nda-settings.actions';
import { checkExpiredAndRenewNdas } from '@/server/actions/admin/nda/admin-nda-signatures.actions';
import { Button } from '@/components/islands/admin/intro/IntroTabComponents';

interface Props {
    initialOverview: NdaCommitteeOverview[];
    bestuurMembers: NdaCommitteeMember[];
    initialSecretaryUserId: string | null;
    initialIsActive: boolean;
}

const templateStatusLabel: Record<string, string> = {
    draft: 'Concept',
    signed: 'Bevestigd, klaar om te versturen',
    archived: 'Gearchiveerd',
};

export default function NdaOverviewIsland({ initialOverview, bestuurMembers, initialSecretaryUserId, initialIsActive }: Props) {
    const [secretaryUserId, setSecretaryUserId] = useState(initialSecretaryUserId ?? '');
    const [savingSecretary, setSavingSecretary] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(initialIsActive);
    const [togglingActive, setTogglingActive] = useState(false);

    const handleSecretaryChange = async (userId: string) => {
        setSecretaryUserId(userId);
        setSavingSecretary(true);
        await setNdaSecretary(userId);
        setSavingSecretary(false);
    };

    const handleCheckExpiry = async () => {
        setChecking(true);
        setCheckResult(null);
        const result = await checkExpiredAndRenewNdas();
        setChecking(false);
        setCheckResult(`${result.expiredCount} NDA('s) verlopen gezet, ${result.renewalsSent} verlenging(en) verstuurd.`);
    };

    const handleToggleActive = async () => {
        setTogglingActive(true);
        const result = await setNdaSystemActive(!isActive);
        setTogglingActive(false);
        if (result.success) {
            setIsActive(result.active ?? !isActive);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-6 rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold text-(--beheer-text)">NDA-systeem actief</h3>
                        <p className="mt-0.5 text-xs text-(--beheer-text-muted)">
                            Zet aan om de NDA-pagina zichtbaar te maken voor leden en de dagelijkse automatische verloop-check in te schakelen.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { void handleToggleActive(); }}
                        disabled={togglingActive}
                        aria-label="NDA-systeem actief"
                        className={`btn-toggle-nda-active relative flex h-6 w-12 shrink-0 items-center rounded-full p-1 transition-all ${isActive ? 'bg-beheer-active' : 'bg-beheer-inactive'} hover:opacity-90 active:scale-95 disabled:opacity-50`}
                    >
                        {togglingActive ? (
                            <Loader2 className="mx-auto size-4 animate-spin text-white" />
                        ) : (
                            <div className={`size-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-0'} shadow-sm`} />
                        )}
                    </button>
                </div>

                <div className="flex flex-col justify-between gap-4 border-t border-(--beheer-border)/50 pt-6 sm:flex-row sm:items-end">
                    <div className="max-w-sm flex-1">
                        <label className="px-1 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">Secretaris (ondertekent namens de vereniging)</label>
                        <select
                            value={secretaryUserId}
                            onChange={(e) => { void handleSecretaryChange(e.target.value); }}
                            disabled={savingSecretary}
                            className="mt-2 beheer-input w-full"
                        >
                            <option value="">Nog niet ingesteld</option>
                            {bestuurMembers.map((m) => (
                                <option key={m.userId} value={m.userId}>{m.displayName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                        <Button onClick={() => { void handleCheckExpiry(); }} loading={checking} icon={RefreshCw} variant="secondary">
                            Controleer verlopen NDA&apos;s
                        </Button>
                        {checkResult && <p className="text-xs text-(--beheer-text-muted)">{checkResult}</p>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {initialOverview.map((row) => (
                    <Link
                        key={row.committee.id}
                        href={`/beheer/nda/${row.committee.id}`}
                        className="group block rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-6 shadow-sm transition-all hover:border-(--beheer-accent)/30 hover:shadow-xl"
                    >
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-(--beheer-accent)/10 text-(--beheer-accent)">
                                <FileSignature className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="truncate text-base font-semibold text-(--beheer-text)">{row.committee.name}</h4>
                                <p className="text-xs text-(--beheer-text-muted)">
                                    {row.templateStatus ? `${templateStatusLabel[row.templateStatus]} (${row.templateYear})` : 'Geen NDA geüpload'}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-(--beheer-text-muted)">
                            <span className="flex items-center gap-1"><Users className="size-3.5" />{row.memberCount}</span>
                            <span className="flex items-center gap-1 text-emerald-500"><ShieldCheck className="size-3.5" />{row.statusCounts.signed}</span>
                            <span className="flex items-center gap-1 text-amber-500"><Clock className="size-3.5" />{row.statusCounts.pending}</span>
                            <span className="flex items-center gap-1 text-orange-500"><AlertTriangle className="size-3.5" />{row.statusCounts.expiring_soon}</span>
                            <span className="flex items-center gap-1 text-red-500"><XCircle className="size-3.5" />{row.statusCounts.expired}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
