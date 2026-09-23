'use client';

import { Mail, Clock, Trash, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { type Signup } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import {
    getSignupName,
    getSignupEmail,
    getSignupPhone,
    MemberBadge,
    PaymentBadge
} from '@/lib/activities/activity-signup.utils';

const formatDateTime = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);

interface ActivitySignupTableProps {
    signups: Signup[];
    canAccessEdit: boolean;
    onToggleCheckIn: (id: number, current: boolean) => void;
    onDelete: (id: number, email: string) => void;
    isDeletingId: number | null;
}

export default function ActivitySignupTable({
    signups,
    canAccessEdit,
    onToggleCheckIn,
    onDelete,
    isDeletingId
}: ActivitySignupTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-200 border-collapse text-left">
                <thead>
                    <tr className="border-b border-(--beheer-border) bg-(--beheer-card-soft) text-[10px] font-semibold tracking-widest text-(--beheer-text-muted)">
                        <th className="px-6 py-4">Inchecken</th>
                        <th className="px-6 py-4">Deelnemer</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Lidmaatschap & Datum</th>
                        <th className="px-6 py-4 text-right">Acties</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-(--beheer-border)">
                    {signups.map(signup => {
                        const name = getSignupName(signup);
                        const email = getSignupEmail(signup);
                        const phone = getSignupPhone(signup);
                        const isRowDeleting = isDeletingId === signup.id;

                        const createdAt = signup.created_at ? new Date(signup.created_at) : null;
                        const checkedInAt = signup.checked_in_at ? new Date(signup.checked_in_at) : null;

                        return (
                            <tr key={signup.id} className={`group transition-colors hover:bg-(--beheer-card-soft) ${isRowDeleting ? 'pointer-events-none opacity-50' : ''}`}>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            onClick={() => onToggleCheckIn(signup.id, !!signup.checked_in)}
                                            disabled={!canAccessEdit}
                                            className={`beheer-button flex items-center gap-2 self-start rounded-xl border px-3 py-2 text-[10px] font-semibold tracking-wider shadow-sm transition-all active:scale-95 ${signup.checked_in
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-500'
                                                : 'border-(--beheer-border) bg-(--beheer-card-soft) text-(--beheer-text-muted) hover:border-emerald-500/50 hover:text-emerald-500'
                                                } ${!canAccessEdit ? 'cursor-not-allowed opacity-50' : ''}`}
                                        >
                                            {signup.checked_in ? (
                                                <>
                                                    <CheckCircle2 className="size-4" />
                                                    <span>Ingecheckt</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="size-4" />
                                                    <span>Inchecken</span>
                                                </>
                                            )}
                                        </button>
                                        {signup.checked_in && checkedInAt && !isNaN(checkedInAt.getTime()) && (
                                            <div className="ml-1 flex items-center gap-1 text-[9px] font-semibold tracking-tight text-(--beheer-text-muted) opacity-60">
                                                <Clock className="size-3" />
                                                {formatTime(checkedInAt)}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="mb-1 text-sm font-semibold tracking-tight text-(--beheer-text)">{name}</div>
                                </td>
                                <td className="space-y-1.5 px-6 py-5">
                                    <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">
                                        <Mail className="size-3.5 opacity-50" />
                                        <a href={`mailto:${email}`} className="transition-colors hover:text-(--beheer-accent)">{email}</a>
                                    </div>
                                    {phone && phone !== '-' && (
                                        <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-(--beheer-text-muted)">
                                            <a href={`tel:${phone}`} className="transition-colors hover:text-(--beheer-accent)">{phone}</a>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="mb-2 flex flex-wrap gap-2">
                                        <MemberBadge signup={signup} />
                                        <PaymentBadge status={signup.payment_status || 'open'} amount={signup.amount_paid} />
                                    </div>
                                    <div className="text-[10px] font-bold tracking-widest text-(--beheer-text-muted)">
                                        {createdAt && !isNaN(createdAt.getTime())
                                            ? formatDateTime(createdAt)
                                            : 'Datum onbekend'}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    {canAccessEdit && (
                                        <button
                                            onClick={() => onDelete(signup.id, email)}
                                            className="icon-button inline-flex size-10 cursor-pointer items-center justify-center rounded-xl text-(--beheer-text-muted) opacity-30 transition-all hover:bg-red-500/10 hover:text-red-500 hover:opacity-100"
                                            title="Verwijder aanmelding"
                                        >
                                            {isRowDeleting ? (
                                                <Loader2 className="size-5 animate-spin" />
                                            ) : (
                                                <Trash className="size-5" />
                                            )}
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
