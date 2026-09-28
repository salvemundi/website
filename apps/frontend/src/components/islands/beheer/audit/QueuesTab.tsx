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
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-12 text-center shadow-xl">
                <Loader2 className="mx-auto mb-4 size-8 animate-spin text-(--beheer-accent)" />
                <h3 className="text-base font-bold tracking-tight text-(--beheer-text)">
                    Wachtrijstatus ophalen...
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs font-medium text-(--beheer-text-muted)">
                    De actuele gegevens worden opgehaald van de Azure Management Service.
                </p>
            </div>
        );
    }

    if (!queueData) {
        return (
            <div className="rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) p-8 text-center shadow-xl">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500">
                    <AlertCircle className="size-6" />
                </div>
                <h3 className="text-base font-bold tracking-tight text-(--beheer-text)">
                    Wachtrijmonitoring niet beschikbaar
                </h3>
                <p className="mx-auto mt-2 max-w-md text-xs font-medium text-(--beheer-text-muted)">
                    {error || "De Azure Management Service is momenteel offline of niet bereikbaar vanaf deze omgeving. Zorg dat de service draait of verbind met de VPN als je lokaal ontwikkelt."}
                </p>
                {onRefresh && (
                    <div className="mt-6">
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isLoading}
                            className="form-button inline-flex items-center gap-2 rounded-xl bg-(--beheer-accent) px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
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
                        className="beheer-button inline-flex items-center gap-2 rounded-xl border border-(--beheer-border) bg-(--beheer-card-soft) px-3 py-1.5 text-xs font-semibold text-(--beheer-text) hover:bg-(--beheer-card-bg) disabled:opacity-50"
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
                        <div key={qKey} className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-xl">
                            <div className="flex items-center justify-between border-b border-(--beheer-border)/50 bg-(--beheer-card-soft)/30 p-6">
                                <div>
                                    <h3 className="text-base font-semibold tracking-tight text-(--beheer-text)">
                                        {qKey === 'new_users' ? 'Nieuwe Leden Wachtrij' : 'Sync Wachtrij'}
                                    </h3>
                                    <p className="mt-1 text-xs font-medium text-(--beheer-text-muted) opacity-50">
                                        Redis: {qKey === 'new_users' ? 'v7:queue:provision:new_user' : 'v7:queue:provision:sync_existing'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="rounded-full bg-(--beheer-accent)/10 px-3 py-1 text-sm font-semibold text-(--beheer-accent)">
                                        {q?.count || 0}
                                    </span>
                                </div>
                            </div>
                            <div className="p-0">
                                {!q?.samples || q.samples.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <CheckCircle className="mx-auto mb-4 size-10 text-(--beheer-active) opacity-20" />
                                        <p className="text-xs font-medium text-(--beheer-text-muted)">Geen actieve taken</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-(--beheer-border)/50 bg-(--beheer-card-soft)/50 font-semibold tracking-tight text-(--beheer-text-muted)">
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
                                                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
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

