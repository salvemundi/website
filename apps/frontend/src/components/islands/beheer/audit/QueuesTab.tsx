'use client';

import { CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import type { QueueInfo } from '@salvemundi/validations';

interface QueueTask {
    email?: string | null;
    userId?: string | null;
    retries: number;
    maxRetries: number;
}

interface QueuesTabProps {
    queueData: { new_users?: QueueInfo; sync_existing?: QueueInfo } | null;
    isLoading?: boolean;
    error?: string | null;
    onRefresh?: () => void;
}

export default function QueuesTab({ queueData, isLoading = false, error, onRefresh }: QueuesTabProps) {
    if (isLoading && !queueData) {
        return (
            <div className="empty-state-box">
                <Loader2 className="spinner-accent-lg" />
                <h3 className="text-base font-bold tracking-tight text-(--beheer-text)">
                    Wachtrijstatus ophalen...
                </h3>
                <p className="empty-state-subtitle">
                    De actuele gegevens worden opgehaald van de Azure Management Service.
                </p>
            </div>
        );
    }

    if (!queueData) {
        return (
            <div className="empty-state-box">
                <div className="alert-icon-box-amber">
                    <AlertCircle className="size-6" />
                </div>
                <h3 className="text-base font-bold tracking-tight text-(--beheer-text)">
                    Wachtrijmonitoring niet beschikbaar
                </h3>
                <p className="empty-state-subtitle">
                    {error || "De Azure Management Service is momenteel offline of niet bereikbaar vanaf deze omgeving. Zorg dat de service draait of verbind met de VPN als je lokaal ontwikkelt."}
                </p>
                {onRefresh && (
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="form-button"
                        >
                            <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Opnieuw proberen
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {onRefresh && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="beheer-button-secondary"
                    >
                        <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                        Vernieuwen
                    </button>
                </div>
            )}
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {(['new_users', 'sync_existing'] as const).map(qKey => {
                    const q = qKey === 'new_users' ? queueData.new_users : queueData.sync_existing;
                    return (
                        <div key={qKey} className="form-card">
                            <div className="card-header-flex">
                                <div>
                                    <h3 className="text-base font-semibold tracking-tight text-(--beheer-text)">
                                        {qKey === 'new_users' ? 'Nieuwe Leden Wachtrij' : 'Sync Wachtrij'}
                                    </h3>
                                    <p className="card-subtitle-muted">
                                        Redis: {qKey === 'new_users' ? 'v7:queue:provision:new_user' : 'v7:queue:provision:sync_existing'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="badge-pill-accent">
                                        {q?.count || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="p-0">
                                {!q?.samples || q.samples.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <CheckCircle className="icon-watermark-lg" />
                                        <p className="text-xs font-medium text-(--beheer-text-muted)">Geen actieve taken</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="table-header-row">
                                                <th className="p-3">Target</th>
                                                <th className="p-3 text-center">Retries</th>
                                                <th className="p-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-(--beheer-border)/10">
                                            {(q.samples as QueueTask[]).map((task, idx: number) => (
                                                <tr key={idx} className="hover:bg-(--beheer-accent)/5">
                                                    <td className="p-3 font-bold text-(--beheer-text)">
                                                        {task.email || task.userId || 'Onbekend'}
                                                    </td>
                                                    <td className="p-3 text-center font-semibold">
                                                        {task.retries} / {task.maxRetries}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <span className="badge-pill-warning">
                                                            Wachtend
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

