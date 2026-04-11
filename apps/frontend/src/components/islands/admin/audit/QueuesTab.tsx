'use client';

import React from 'react';
import { Loader2, CheckCircle } from 'lucide-react';

interface QueuesTabProps {
    isLoading: boolean;
    queueData: any;
}

export default function QueuesTab({ isLoading, queueData }: QueuesTabProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {['new_users', 'sync_existing'].map(qKey => (
                <div key={qKey} className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-[var(--beheer-border)]/50 flex justify-between items-center bg-[var(--beheer-card-soft)]/30">
                        <div>
                            <h3 className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight">
                                {qKey === 'new_users' ? 'Nieuwe Leden Wachtrij' : 'Sync Wachtrij'}
                            </h3>
                            <p className="text-[10px] font-bold text-[var(--beheer-text-muted)] uppercase tracking-widest mt-1">
                                Redis: {qKey === 'new_users' ? 'v7:queue:provision:new_user' : 'v7:queue:provision:sync_existing'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] rounded-full text-xs font-black">
                                {queueData?.[qKey]?.count || 0}
                            </span>
                        </div>
                    </div>
                    <div className="p-0">
                        {isLoading ? (
                            <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[var(--beheer-accent)]" /></div>
                        ) : !queueData?.[qKey]?.samples || queueData[qKey].samples.length === 0 ? (
                            <div className="p-12 text-center">
                                <CheckCircle className="h-10 w-10 text-[var(--beheer-active)] mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Geen actieve taken</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-[10px]">
                                <thead>
                                    <tr className="bg-[var(--beheer-card-soft)]/50 border-b border-[var(--beheer-border)]/50 font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">
                                        <th className="p-3">Target</th>
                                        <th className="p-3 text-center">Retries</th>
                                        <th className="p-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--beheer-border)]/10">
                                    {queueData[qKey].samples.map((task: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-[var(--beheer-accent)]/[0.02]">
                                            <td className="p-3 font-bold text-[var(--beheer-text)]">
                                                {task.email || task.userId || 'Unknown'}
                                            </td>
                                            <td className="p-3 text-center font-black">
                                                {task.retries} / {task.maxRetries}
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase font-black text-[8px]">
                                                    Pending
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
