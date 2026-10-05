'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FileSignature, ShieldCheck, Clock, AlertTriangle, XCircle, Users, RefreshCw, Loader2 } from 'lucide-react';
import type { NdaCommitteeOverview } from '@/server/queries/nda/beheer-nda.queries';
import type { NdaCommitteeMember } from '@/server/queries/nda/beheer-nda.queries';
import { setNdaSecretary, setNdaSystemActive } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';
import { checkExpiredAndRenewNdas } from '@/server/actions/beheer/nda/beheer-nda-signatures.actions';
import { Button } from '@/components/islands/beheer/intro/IntroTabComponents';

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
            <div className="beheer-card">
                <div className="beheer-header">
                    <div>
                        <h3 className="beheer-card-title">NDA-systeem actief</h3>
                        <p className="beheer-card-subtitle">
                            Zet aan om de NDA-pagina zichtbaar te maken voor leden en de dagelijkse automatische verloop-check in te schakelen.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => { void handleToggleActive(); }}
                        disabled={togglingActive}
                        aria-label="NDA-systeem actief"
                        data-active={isActive}
                        className="btn-toggle-switch"
                    >
                        {togglingActive ? (
                            <Loader2 className="loader-spinner" />
                        ) : (
                            <div data-active={isActive} className="visibility-toggle-thumb" />
                        )}
                    </button>
                </div>

                <div className="beheer-section-row">
                    <div className="form-col-field">
                        <label className="form-label-muted">Secretaris (ondertekent namens de vereniging)</label>
                        <select
                            value={secretaryUserId}
                            onChange={(e) => { void handleSecretaryChange(e.target.value); }}
                            disabled={savingSecretary}
                            className="beheer-input"
                        >
                            <option value="">Nog niet ingesteld</option>
                            {bestuurMembers.map((m) => (
                                <option key={m.userId} value={m.userId}>{m.displayName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="beheer-action-col">
                        <Button onClick={() => { void handleCheckExpiry(); }} loading={checking} icon={RefreshCw} variant="secondary">
                            Controleer verlopen NDA&apos;s
                        </Button>
                        {checkResult && <p className="form-label-muted">{checkResult}</p>}
                    </div>
                </div>
            </div>

            <div className="grid-cards-3">
                {initialOverview.map((row) => (
                    <Link
                        key={row.committee.id}
                        href={`/beheer/nda/${row.committee.id}`}
                        className="beheer-card-interactive"
                    >
                        <div className="beheer-header">
                            <div className="icon-box-accent">
                                <FileSignature className="size-5" />
                            </div>
                            <div className="col-grow-min">
                                <h4 className="beheer-card-title">{row.committee.name}</h4>
                                <p className="beheer-card-subtitle">
                                    {row.templateStatus ? `${templateStatusLabel[row.templateStatus]} (${row.templateYear})` : 'Geen NDA geüpload'}
                                </p>
                            </div>
                        </div>
                        <div className="beheer-status-row">
                            <span className="status-text"><Users className="status-icon" />{row.memberCount}</span>
                            <span data-status="success" className="status-text"><ShieldCheck className="status-icon" />{row.statusCounts.signed}</span>
                            <span data-status="warning" className="status-text"><Clock className="status-icon" />{row.statusCounts.pending}</span>
                            <span data-status="warning" className="status-text"><AlertTriangle className="status-icon" />{row.statusCounts.expiring_soon}</span>
                            <span data-status="error" className="status-text"><XCircle className="status-icon" />{row.statusCounts.expired}</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
