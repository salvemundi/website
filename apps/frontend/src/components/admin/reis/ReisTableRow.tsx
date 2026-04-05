'use client';

import { Fragment } from 'react';
import { format } from 'date-fns';
import { Loader2, Edit, Trash2, Send, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations';

interface ReisTableRowProps {
    signup: TripSignup;
    isExpanded: boolean;
    onToggleExpand: (signup: TripSignup) => void;
    statusBadge: { label: string; color: string };
    paymentStatus: { label: string; color: string };
    isStatusLoading: boolean;
    isDeleteLoading: boolean;
    sendingEmailType: string | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    activities: TripSignupActivity[];
    allowFinalPayments: boolean;
}

export default function ReisTableRow({
    signup,
    isExpanded,
    onToggleExpand,
    statusBadge,
    paymentStatus,
    isStatusLoading,
    isDeleteLoading,
    sendingEmailType,
    onStatusChange,
    onDelete,
    onResendEmail,
    activities,
    allowFinalPayments
}: ReisTableRowProps) {
    const router = useRouter();

    return (
        <Fragment>
            <tr onClick={() => onToggleExpand(signup)} className="hover:bg-[var(--beheer-accent)]/[0.02] cursor-pointer transition-colors group">
                <td className="px-3 sm:px-6 py-4">
                    <div className="text-sm font-black text-[var(--beheer-text)] uppercase tracking-tight group-hover:text-[var(--beheer-accent)] transition-colors">
                        {signup.first_name} {signup.last_name}
                    </div>
                    <div className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{signup.email}</div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs font-black text-[var(--beheer-text)] uppercase tracking-widest hidden sm:table-cell">
                    {signup.date_of_birth ? format(new Date(signup.date_of_birth), 'dd-MM-yyyy') : '-'}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${signup.role === 'crew' ? 'bg-[var(--beheer-accent)] text-white shadow-sm shadow-[var(--beheer-accent)]/20' : 'bg-[var(--bg-main)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]/50'}`}>
                        {signup.role === 'crew' ? 'Crew' : 'User'}
                    </span>
                </td>
                <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    {isStatusLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin text-[var(--beheer-accent)]" />
                    ) : (
                        <select
                            value={signup.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => onStatusChange(signup.id, e.target.value)}
                            className={`px-1.5 sm:px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border-0 ${statusBadge.color} dark:bg-opacity-20 w-full sm:w-auto cursor-pointer focus:ring-2 focus:ring-[var(--beheer-accent)]`}>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </select>
                    )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${paymentStatus.color}`}>
                        {paymentStatus.label}
                    </span>
                </td>
                <td className="px-2 sm:px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/beheer/reis/deelnemer/${signup.id}`); }}
                            className="text-[var(--beheer-accent)] hover:opacity-70 transition-all active:scale-90 p-2 bg-[var(--beheer-accent)]/5 rounded-xl border border-[var(--beheer-accent)]/10" 
                            title="Bewerken"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(signup.id); }}
                            disabled={isDeleteLoading}
                            className="text-[var(--beheer-inactive)] hover:opacity-70 disabled:opacity-50 transition-all active:scale-90 p-2 bg-[var(--beheer-inactive)]/5 rounded-xl border border-[var(--beheer-inactive)]/10"
                            title="Verwijderen"
                        >
                            {isDeleteLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="h-4 w-4" />
                            )}
                        </button>
                        <div className="text-[var(--beheer-text-muted)] p-2 hover:text-[var(--beheer-text)] transition-colors">
                            <span className="text-xs transition-transform duration-300 inline-block" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                        </div>
                    </div>
                </td>
            </tr>
            {isExpanded && (
                <tr className="bg-[var(--bg-main)]/30">
                    <td colSpan={6} className="px-8 py-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Contact Gegevens</p>
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-[var(--beheer-text)] uppercase tracking-tight">{signup.email}</p>
                                    <p className="text-xs font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{signup.phone_number || 'Geen telefoon'}</p>
                                </div>
                                <div className="pt-2">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Document: <span className="text-[var(--beheer-text)]">{signup.id_document === 'passport' ? 'Paspoort' : signup.id_document === 'id_card' ? 'ID Kaart' : (signup.id_document || '-')}</span></p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">Nummer: <span className="text-[var(--beheer-text)]">{signup.document_number || '-'}</span></p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Medisch & Info</p>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">Allergieën</p>
                                    <p className="text-xs font-semibold text-[var(--beheer-text)]">{signup.allergies || 'Geen'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-1">Bijzonderheden</p>
                                    <p className="text-xs font-semibold text-[var(--beheer-text)]">{signup.special_notes || 'Geen'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-accent)]">Activiteiten</p>
                                <div className="space-y-3">
                                    {activities ? (
                                        activities.length > 0 ? (
                                            activities.map(a => {
                                                const activity = a as any;
                                                const name = activity.activity_name || activity.trip_activity_id?.name || 'Activiteit';
                                                const rawOptions = typeof activity.selected_options === 'string' ? JSON.parse(activity.selected_options) : (activity.selected_options || {});
                                                const metaOptionsRaw = activity.activity_options || activity.trip_activity_id?.options || [];
                                                const metaOptions = typeof metaOptionsRaw === 'string' ? JSON.parse(metaOptionsRaw) : (metaOptionsRaw || []);
                                                
                                                // Map IDs to names
                                                const selectedNames = Object.keys(rawOptions)
                                                    .map(optId => {
                                                        const opt = metaOptions.find((m: any) => m.id === optId);
                                                        return opt?.name || optId; // Fallback to ID if name not found
                                                    })
                                                    .filter(Boolean);

                                                return (
                                                    <div key={a.id} className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-1.5 w-1.5 rounded-full bg-[var(--beheer-accent)]"></div>
                                                            <span className="text-xs font-black uppercase tracking-tight text-[var(--beheer-text)]">
                                                                {name}
                                                            </span>
                                                        </div>
                                                        {selectedNames.length > 0 && (
                                                            <div className="ml-3.5 flex flex-wrap gap-1">
                                                                {selectedNames.map((optName, idx) => (
                                                                    <span key={idx} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--beheer-accent)]/5 text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]/30 uppercase tracking-tighter">
                                                                        {optName}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-xs text-[var(--beheer-text-muted)] italic">Geen selectie</p>
                                        )
                                    ) : (
                                        <p className="text-xs text-[var(--beheer-text-muted)] italic">Laden...</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-[var(--beheer-border)]/50 pt-6 mt-6">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] mb-4">Betaalverzoek Handmatig Versturen</p>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={(e) => { e.stopPropagation(); onResendEmail(signup.id, 'deposit'); }}
                                    disabled={sendingEmailType === 'deposit'}
                                    className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signup.deposit_email_sent ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]' : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 hover:bg-yellow-500/20'}`}
                                >
                                    {sendingEmailType === 'deposit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Aanbetaling {signup.deposit_email_sent && <span className="opacity-60">(OK)</span>}
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); onResendEmail(signup.id, 'final'); }}
                                    disabled={sendingEmailType === 'final' || !allowFinalPayments}
                                    className={`flex items-center justify-center gap-3 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${signup.final_email_sent ? 'bg-[var(--beheer-card-bg)] text-[var(--beheer-text-muted)] border border-[var(--beheer-border)]' : 'bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] border border-[var(--beheer-active)]/20 hover:bg-[var(--beheer-active)]/20'}`}
                                >
                                    {sendingEmailType === 'final' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                    Restbetaling {signup.final_email_sent && <span className="opacity-60">(OK)</span>}
                                </button>
                                {!allowFinalPayments && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-red-500/70 uppercase tracking-widest bg-red-500/5 px-4 py-2 rounded-lg border border-red-500/10">
                                        <AlertCircle className="h-3 w-3" />
                                        Restbetalingen Gesloten
                                    </div>
                                )}
                            </div>
                        </div>
                    </td>
                </tr>
            )}
        </Fragment>
    );
}
