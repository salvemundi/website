'use client';

import { CheckCircle } from 'lucide-react';
import { QueueInfo } from '@salvemundi/validations';

interface QueueTask {
    email?: string | null;
    userId?: string | null;
    retries: number;
    maxRetries: number;
}

interface QueuesTabProps {
    queueData: { new_users?: QueueInfo; sync_existing?: QueueInfo } | null;
}

export default function QueuesTab({ queueData }: QueuesTabProps) {
    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {(['new_users', 'sync_existing'] as const).map(qKey => {
                const q = queueData
                    ? (qKey === 'new_users' ? queueData.new_users : queueData.sync_existing)
                    : undefined;
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
                                            <tr key={idx} className="hover:bg-(--beheer-accent)/2">
                                                <td className="p-3 font-bold text-(--beheer-text)">
                                                    {task.email || task.userId || 'Unknown'}
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
    );
}
