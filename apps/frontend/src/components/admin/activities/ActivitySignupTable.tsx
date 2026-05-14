'use client';

import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Mail, Phone, Clock, Trash2, CheckCircle2, Circle, Loader2 } from 'lucide-react';
import { type Signup } from '@/components/islands/admin/activities/ActiviteitAanmeldingenIsland';
import { 
    getSignupName, 
    getSignupEmail, 
    getSignupPhone, 
    MemberBadge, 
    PaymentBadge 
} from '@/lib/activity-signup.utils';

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
            <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                    <tr className="border-b border-[var(--beheer-border)] bg-[var(--beheer-card-soft)] text-[10px] font-semibold tracking-widest text-[var(--beheer-text-muted)]">
                        <th className="px-6 py-4">Inchecken</th>
                        <th className="px-6 py-4">Deelnemer</th>
                        <th className="px-6 py-4">Contact</th>
                        <th className="px-6 py-4">Lidmaatschap & Datum</th>
                        <th className="px-6 py-4 text-right">Acties</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--beheer-border)]">
                    {signups.map(signup => {
                        const name = getSignupName(signup);
                        const email = getSignupEmail(signup);
                        const phone = getSignupPhone(signup);
                        const isRowDeleting = isDeletingId === signup.id;
                        
                        return (
                            <tr key={signup.id} className={`group hover:bg-[var(--beheer-card-soft)] transition-colors ${isRowDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col gap-1.5">
                                        <button
                                            onClick={() => onToggleCheckIn(signup.id, !!signup.checked_in)}
                                            disabled={!canAccessEdit}
                                            className={`flex items-center gap-2 self-start px-3 py-2 rounded-xl transition-all font-semibold text-[10px] tracking-wider border shadow-sm active:scale-95 ${
                                                signup.checked_in 
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                                                : 'bg-[var(--beheer-card-soft)] text-[var(--beheer-text-muted)] border-[var(--beheer-border)] hover:border-emerald-500/50 hover:text-emerald-500'
                                            } ${!canAccessEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {signup.checked_in ? (
                                                <>
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Ingecheckt</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="h-4 w-4" />
                                                    <span>Inchecken</span>
                                                </>
                                            )}
                                        </button>
                                        {signup.checked_in && signup.checked_in_at && (
                                            <div className="flex items-center gap-1 text-[9px] text-[var(--beheer-text-muted)] opacity-60 font-semibold tracking-tight ml-1">
                                                <Clock className="h-3 w-3" />
                                                {format(new Date(signup.checked_in_at), 'HH:mm')}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="font-semibold text-[var(--beheer-text)] text-sm tracking-tight mb-1">{name}</div>
                                </td>
                                <td className="px-6 py-5 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-[var(--beheer-text-muted)] font-semibold tracking-tight">
                                        <Mail className="h-3.5 w-3.5 opacity-50" />
                                        <a href={`mailto:${email}`} className="hover:text-[var(--beheer-accent)] transition-colors">{email}</a>
                                    </div>
                                    {phone && phone !== '-' && (
                                        <div className="flex items-center gap-2 text-xs text-[var(--beheer-text-muted)] font-semibold tracking-tight">
                                            <Phone className="h-3.5 w-3.5 opacity-50" />
                                            <a href={`tel:${phone}`} className="hover:text-[var(--beheer-accent)] transition-colors">{phone}</a>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        <MemberBadge signup={signup} />
                                        <PaymentBadge status={signup.payment_status || 'open'} />
                                    </div>
                                    <div className="text-[10px] text-[var(--beheer-text-muted)] font-bold tracking-widest">
                                        {signup.created_at && !isNaN(new Date(signup.created_at).getTime()) 
                                            ? format(new Date(signup.created_at), 'dd MMM yyyy, HH:mm', { locale: nl }) 
                                            : 'Datum onbekend'}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    {canAccessEdit && (
                                        <button
                                            onClick={() => onDelete(signup.id, email)}
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-[var(--beheer-text-muted)] opacity-30 hover:opacity-100 hover:text-red-500 hover:bg-red-500/10 transition-all cursor-pointer"
                                            title="Verwijder aanmelding"
                                        >
                                            {isRowDeleting ? (
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-5 w-5" />
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
