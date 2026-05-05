'use client';

import { AlertCircle } from 'lucide-react';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/admin-reis.zod';
import ReisTableRow from './ReisTableRow';

interface ReisTableProps {
    filteredSignups: TripSignup[];
    selectedSignupId: number | null;
    onOpenSignup: (signup: TripSignup, edit?: boolean) => void;
    getStatusBadge: (status: string) => { label: string; color: string };
    getPaymentStatus: (signup: TripSignup) => { label: string; color: string };
    actionStates: { status: Set<number>; delete: Set<number> };
    sendingEmailTo: { signupId: number; type: string } | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    signupActivitiesMap: Record<number, TripSignupActivity[]>;
    allowFinalPayments: boolean;
    isBusTrip?: boolean;
}

export default function ReisTable({
    filteredSignups = [],
    selectedSignupId = null,
    onOpenSignup = () => {},
    getStatusBadge = () => ({ label: '', color: '' }),
    getPaymentStatus = () => ({ label: '', color: '' }),
    actionStates = { status: new Set(), delete: new Set() },
    sendingEmailTo = null,
    onStatusChange = () => {},
    onDelete = () => {},
    onResendEmail = () => {},
    signupActivitiesMap = {},
    allowFinalPayments = false,
    isBusTrip = false
}: ReisTableProps) {
    return (
        <div className="flex flex-col gap-3">
            {filteredSignups.length === 0 ? (
                <div className="bg-[var(--beheer-card-bg)]/50 rounded-3xl border border-[var(--beheer-border)]/40 p-20 text-center">
                    <AlertCircle className="h-12 w-12 text-[var(--beheer-text-muted)] mx-auto mb-4 opacity-20" />
                    <p className="text-[var(--beheer-text-muted)] font-semibold tracking-widest text-[10px]">Geen aanmeldingen gevonden</p>
                </div>
            ) : (
                <>
                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredSignups.map(signup => (
                            <ReisTableRow 
                                key={signup.id}
                                signup={signup}
                                isSelected={selectedSignupId === signup.id}
                                onSelect={onOpenSignup}
                                statusBadge={getStatusBadge(signup.status || 'registered')}
                                paymentStatus={getPaymentStatus(signup)}
                                isStatusLoading={actionStates.status.has(signup.id)}
                                isDeleteLoading={actionStates.delete.has(signup.id)}
                                sendingEmailType={sendingEmailTo?.signupId === signup.id ? sendingEmailTo.type : null}
                                onStatusChange={onStatusChange}
                                onDelete={onDelete}
                                onResendEmail={onResendEmail}
                                activities={signupActivitiesMap[signup.id] || []}
                                allowFinalPayments={allowFinalPayments}
                                isBusTrip={isBusTrip}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
