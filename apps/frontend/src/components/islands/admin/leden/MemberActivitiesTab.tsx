'use client';

import React from 'react';
import { History } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { SignupStatus } from './LedenSharedComponents';

interface Signup {
    id: number;
    payment_status?: string;
    created_at: string;
    event_id: {
        id: string;
        name: string;
        event_date: string;
    };
}

interface Props {
    signups: Signup[];
}

export default function MemberActivitiesTab({ signups }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return format(new Date(dateString), 'd MMMM yyyy', { locale: nl });
        } catch (e) {
            return 'Onbekend';
        }
    };

    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] overflow-hidden shadow-sm animate-in fade-in duration-500">
            <div className="p-8 border-b border-[var(--beheer-border)]">
                <h3 className="text-xl font-black text-[var(--beheer-text)] leading-tight uppercase tracking-tight">Activiteiten Historie</h3>
                <p className="text-xs text-[var(--beheer-text-muted)] font-black uppercase tracking-widest mt-1 opacity-60">Recente inschrijvingen voor activiteiten</p>
            </div>
            
            {signups.length === 0 ? (
                <div className="py-20 text-center">
                    <History className="h-12 w-12 text-[var(--beheer-text-muted)] opacity-20 mx-auto mb-4" />
                    <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-xs">Nog geen activiteiten gevonden</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--beheer-border)]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--beheer-card-soft)]/50 text-[10px] uppercase font-black tracking-widest text-[var(--beheer-text-muted)] border-b border-[var(--beheer-border)]">
                                <th className="px-8 py-4">Activiteit</th>
                                <th className="px-8 py-4">Datum</th>
                                <th className="px-8 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]">
                            {signups.map(signup => (
                                <tr key={signup.id} className="group hover:bg-[var(--beheer-card-soft)]/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-extrabold text-[var(--beheer-text)]">{signup.event_id.name}</div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-[var(--beheer-text-muted)] font-bold uppercase tracking-widest">
                                        {formatDate(signup.event_id.event_date)}
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <SignupStatus status={signup.payment_status || 'open'} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
