'use client';

import { AlertCircle } from 'lucide-react';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations';
import ReisTableRow from './ReisTableRow';

interface ReisTableProps {
    filteredSignups: TripSignup[];
    expandedIds: number[];
    onToggleExpand: (signup: TripSignup) => void;
    getStatusBadge: (status: string) => { label: string; color: string };
    getPaymentStatus: (signup: TripSignup) => { label: string; color: string };
    actionStates: { status: Set<number>; delete: Set<number> };
    sendingEmailTo: { signupId: number; type: string } | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    signupActivitiesMap: Record<number, TripSignupActivity[]>;
    allowFinalPayments: boolean;
    isLoading?: boolean;
}

import { Skeleton } from '@/components/ui/Skeleton';

export default function ReisTable({
    filteredSignups = [],
    expandedIds = [],
    onToggleExpand = () => {},
    getStatusBadge = () => ({ label: '', color: '' }),
    getPaymentStatus = () => ({ label: '', color: '' }),
    actionStates = { status: new Set(), delete: new Set() },
    sendingEmailTo = null,
    onStatusChange = () => {},
    onDelete = () => {},
    onResendEmail = () => {},
    signupActivitiesMap = {},
    allowFinalPayments = false,
    isLoading = false
}: ReisTableProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] overflow-hidden">
            {!isLoading && filteredSignups.length === 0 ? (
                <div className="text-center py-20 px-4">
                    <AlertCircle className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                    <p className="text-[var(--beheer-text-muted)] font-black uppercase tracking-widest text-[10px]">Geen aanmeldingen gevonden</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[var(--bg-main)]/50 border-b border-[var(--beheer-border)]">
                            <tr>
                                <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Naam</th>
                                <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Geboortedatum</th>
                                <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden md:table-cell">Rol</th>
                                <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Status</th>
                                <th className="px-3 sm:px-6 py-5 text-left text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest hidden sm:table-cell">Betaling</th>
                                <th className="px-2 sm:px-6 py-5 text-right text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">Acties</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--beheer-border)]/10">
                            {isLoading ? (
                                [...Array(8)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-3 sm:px-6 py-5">
                                            <Skeleton className="h-4 w-32 mb-2" />
                                            <Skeleton className="h-3 w-40 opacity-50" />
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 hidden sm:table-cell">
                                            <Skeleton className="h-4 w-24 opacity-50" />
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 hidden md:table-cell">
                                            <Skeleton className="h-6 w-20 rounded-full" />
                                        </td>
                                        <td className="px-3 sm:px-6 py-5">
                                            <Skeleton className="h-7 w-28 rounded-full" />
                                        </td>
                                        <td className="px-3 sm:px-6 py-5 hidden sm:table-cell">
                                            <Skeleton className="h-7 w-32 rounded-full opacity-50" />
                                        </td>
                                        <td className="px-2 sm:px-6 py-5 text-right">
                                            <div className="flex justify-end gap-3">
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                                <Skeleton className="h-8 w-8 rounded-xl" />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredSignups.map(signup => (
                                <ReisTableRow 
                                    key={signup.id}
                                    signup={signup}
                                    isExpanded={expandedIds.includes(signup.id)}
                                    onToggleExpand={onToggleExpand}
                                    statusBadge={getStatusBadge(signup.status || 'registered')}
                                    paymentStatus={getPaymentStatus(signup)}
                                    isStatusLoading={actionStates.status.has(signup.id)}
                                    isDeleteLoading={actionStates.delete.has(signup.id)}
                                    sendingEmailType={sendingEmailTo?.signupId === signup.id ? sendingEmailTo.type : null}
                                    onStatusChange={onStatusChange}
                                    onDelete={onDelete}
                                    onResendEmail={onResendEmail}
                                    activities={signupActivitiesMap[signup.id]}
                                    allowFinalPayments={allowFinalPayments}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
