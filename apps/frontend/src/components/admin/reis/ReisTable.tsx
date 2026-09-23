'use client';

import { AlertCircle } from 'lucide-react';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/admin-trip.zod';
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
    signupActivitiesMap: Record<number, TripSignupActivity[] | undefined>;
    allowFinalPayments: boolean;
    isBusTrip?: boolean;
}

export default function ReisTable({
    filteredSignups = [],
    selectedSignupId = null,
    onOpenSignup = () => { },
    getStatusBadge = () => ({ label: '', color: '' }),
    getPaymentStatus = () => ({ label: '', color: '' }),
    actionStates = { status: new Set(), delete: new Set() },
    sendingEmailTo = null,
    onStatusChange = () => { },
    onDelete = () => { },
    onResendEmail = () => { },
    signupActivitiesMap = {},
    allowFinalPayments = false,
    isBusTrip = false
}: ReisTableProps) {
    return (
        <div className="flex flex-col gap-3">
            {filteredSignups.length === 0 ? (
                <div className="rounded-3xl border border-(--beheer-border)/40 bg-(--beheer-card-bg)/50 p-20 text-center">
                    <AlertCircle className="mx-auto mb-4 size-12 text-(--beheer-text-muted) opacity-20" />
                    <p className="text-[10px] font-semibold text-(--beheer-text-muted)">Geen aanmeldingen gevonden</p>
                </div>
            ) : (
                <>
                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
