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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(['new_users', 'sync_existing'] as const).map(qKey => {
                const q = queueData
                    ? (qKey === 'new_users' ? queueData.new_users : queueData.sync_existing)
                    : undefined;
                return (
                    <div key={qKey} className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) shadow-xl overflow-hidden">
                        <div className="p-6 border-b border-(--beheer-border)/50 flex justify-between items-center bg-(--beheer-card-soft)/30">
                            <div>
                                <h3 className="text-base font-semibold text-(--beheer-text) tracking-tight">
                                    {qKey === 'new_users' ? 'Nieuwe Leden Wachtrij' : 'Sync Wachtrij'}
                                </h3>
                                <p className="text-xs font-medium text-(--beheer-text-muted) mt-1 opacity-50">
                                    Redis: {qKey === 'new_users' ? 'v7:queue:provision:new_user' : 'v7:queue:provision:sync_existing'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 bg-(--beheer-accent)/10 text-(--beheer-accent) rounded-full text-sm font-semibold">
                                    {q?.count || 0}
                                </span>
                            </div>
                        </div>
                        <div className="p-0">
                            {!q?.samples || q.samples.length === 0 ? (
                                <div className="p-12 text-center">
                                    <CheckCircle className="h-10 w-10 text-(--beheer-active) mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-medium text-(--beheer-text-muted)">Geen actieve taken</p>
                                </div>
                            ) : (
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-(--beheer-card-soft)/50 border-b border-(--beheer-border)/50 font-semibold text-(--beheer-text-muted) tracking-tight">
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
                                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 font-semibold text-[10px]">
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
