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
            safeConsoleError('[MemberActivitiesTab.tsx][MemberActivitiesTab] ', error);
            return 'Onbekend';
        }
    };

    return (
        <div className="overflow-hidden rounded-(--beheer-radius) border border-(--beheer-border) bg-(--beheer-card-bg) shadow-sm">
            <div className="border-b border-(--beheer-border) p-8">
                <h3 className="text-xl leading-tight font-semibold text-(--beheer-text)">Activiteiten Historie</h3>
                <p className="mt-1 text-xs font-semibold text-(--beheer-text-muted) opacity-60">Recente inschrijvingen voor activiteiten</p>
            </div>

            {signups.length === 0 ? (
                <div className="py-20 text-center">
                    <History className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-20" />
                    <p className="text-xs font-semibold text-(--beheer-text-muted)">Nog geen activiteiten gevonden</p>
                </div>
            ) : (
                <div className="max-h-[60vh] scrollbar-thin scrollbar-thumb-(--beheer-border) overflow-auto">
                    <table className="w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft)/50 text-xs font-semibold text-(--beheer-text-muted)">
                                <th className="px-8 py-4">Activiteit</th>
                                <th className="px-8 py-4">Datum</th>
                                <th className="px-8 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--beheer-border)">
                            {signups.map(signup => (
                                <tr key={signup.id} className="group transition-colors hover:bg-(--beheer-card-soft)/30">
                                    <td className="px-8 py-5">
                                        <div className="font-semibold text-(--beheer-text)">{signup.event_id.name}</div>
                                    </td>
                                    <td className="px-8 py-5 text-xs font-medium text-(--beheer-text-muted)">
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