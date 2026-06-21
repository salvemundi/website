'use client';

import { History } from 'lucide-react';
import { SignupStatus } from './LedenSharedComponents';
import { safeConsoleError } from '@/server/utils/logger';

interface Signup {
    id: number;
    payment_status?: string | null;
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
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }).format(new Date(dateString));
        } catch (error) {
            safeConsoleError('[MemberActivitiesTab][formatDate]', error);
            return 'Onbekend';
        }
    };

    return (
        <div className="bg-(--beheer-card-bg) rounded-(--beheer-radius) border border-(--beheer-border) overflow-hidden shadow-sm">
            <div className="p-8 border-b border-(--beheer-border)">
                <h3 className="text-xl font-semibold text-(--beheer-text) leading-tight">Activiteiten Historie</h3>
                <p className="text-xs text-(--beheer-text-muted) font-semibold mt-1 opacity-60">Recente inschrijvingen voor activiteiten</p>
            </div>

            {signups.length === 0 ? (
                <div className="py-20 text-center">
                    <History className="h-12 w-12 text-(--beheer-text-muted) opacity-20 mx-auto mb-4" />
                    <p className="text-(--beheer-text-muted) font-semibold text-xs">Nog geen activiteiten gevonden</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-(--beheer-border)">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--beheer-card-soft)/50 text-xs font-semibold text-(--beheer-text-muted) border-b border-(--beheer-border)">
                                <th className="px-8 py-4">Activiteit</th>
                                <th className="px-8 py-4">Datum</th>
                                <th className="px-8 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)">
                            {signups.map(signup => (
                                <tr key={signup.id} className="group hover:bg-(--beheer-card-soft)/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-semibold text-(--beheer-text)">{signup.event_id.name}</div>
                                    </td>
                                    <td className="px-8 py-5 text-xs text-(--beheer-text-muted) font-medium">
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