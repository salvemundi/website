'use client';

import React from 'react';
import type { TripSignup } from '@salvemundi/validations/schema/admin-trip.zod';
import { formatShortDate } from '@/lib/utils/date-utils';
import {
    User,
    Mail,
    Phone,
    Calendar,
    FileText,
    AlertCircle,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    Bus,
    Briefcase
} from 'lucide-react';
import { safeConsoleError } from '@/server/utils/logger';

interface SignupViewProps {
    signup: TripSignup;
    isBusTrip?: boolean;
}

const formatFullDate = (d: Date) => {
    try {
        return new Intl.DateTimeFormat('nl-NL', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(d);
    } catch (error) {
        safeConsoleError('[SignupView.tsx][formatFullDate] ', error);
        return 'Onbekend';
    }
};

export default function SignupView({ signup, isBusTrip }: SignupViewProps) {
    const getStatusInfo = (status: string | null | undefined) => {
        switch (status) {
            case 'confirmed': return { icon: CheckCircle2, color: 'text-emerald-500', label: 'Bevestigd' };
            case 'waitlist': return { icon: Clock, color: 'text-yellow-500', label: 'Wachtlijst' };
            case 'cancelled': return { icon: XCircle, color: 'text-red-500', label: 'Geannuleerd' };
            default: return { icon: AlertCircle, color: 'text-(--beheer-accent)', label: 'Geregistreerd' };
        }
    };

    const statusInfo = getStatusInfo(signup.status);

    return (
        <div className="grid grid-cols-1 gap-6 p-2 md:grid-cols-2">
            <div className="space-y-6">
                <section>
                    <div className="mb-3 flex items-center gap-2 opacity-50">
                        <User className="size-3 text-(--beheer-accent)" />
                        <h3 className="text-[10px] font-semibold text-(--beheer-text)">Reiziger</h3>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-(--beheer-border)/10 bg-(--bg-main)/30 p-4 shadow-inner">
                        <ViewField label="Naam" value={`${signup.first_name} ${signup.last_name}`} icon={User} />
                        <ViewField label="Email" value={signup.email} icon={Mail} />
                        <ViewField label="Telefoon" value={signup.phone_number || 'Niet opgegeven'} icon={Phone} />
                        <ViewField
                            label="Geb. Datum"
                            value={signup.date_of_birth ? formatFullDate(new Date(signup.date_of_birth)) : 'Niet opgegeven'}
                            icon={Calendar}
                        />
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center gap-2 opacity-50">
                        {isBusTrip ? <Bus className="size-3 text-(--beheer-accent)" /> : <FileText className="size-3 text-(--beheer-accent)" />}
                        <h3 className="text-[10px] font-semibold text-(--beheer-text)">{isBusTrip ? 'Vervoer' : 'Documenten'}</h3>
                    </div>
                    <div className="space-y-3 rounded-2xl border border-(--beheer-border)/10 bg-(--bg-main)/30 p-4 shadow-inner">
                        {isBusTrip ? (
                            <div className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[9px] font-semibold ${signup.willing_to_drive ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-red-500/20 bg-red-500/10 text-red-500'}`}>
                                <div className="flex items-center gap-2">
                                    <Bus className="size-3.5" />
                                    <span>Chauffeur</span>
                                </div>
                                <span>{signup.willing_to_drive ? 'Beschikbaar' : 'Nee'}</span>
                            </div>
                        ) : (
                            <>
                                <ViewField label="ID Type" value={signup.id_document === 'passport' ? 'Paspoort' : signup.id_document === 'id_card' ? 'ID Kaart' : 'Niet opgegeven'} icon={FileText} />
                                <ViewField label="ID Nummer" value={signup.document_number || 'Niet opgegeven'} icon={Briefcase} />
                                <ViewField
                                    label="Vervaldatum"
                                    value={signup.document_expiry_date ? formatShortDate(new Date(signup.document_expiry_date)) : 'Niet opgegeven'}
                                    icon={Calendar}
                                />
                                <ViewField label="Extra Koffer" value={signup.extra_luggage ? 'Ja' : 'Nee'} icon={Briefcase} />
                            </>
                        )}
                    </div>
                </section>
            </div>

            <div className="space-y-6">
                <section>
                    <div className="mb-3 flex items-center gap-2 opacity-50">
                        <CreditCard className="size-3 text-(--beheer-accent)" />
                        <h3 className="text-[10px] font-semibold text-(--beheer-text)">Status</h3>
                    </div>
                    <div className="space-y-4 rounded-2xl border border-(--beheer-border)/10 bg-(--bg-main)/30 p-4 shadow-inner">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">Status</span>
                            <div className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 ${statusInfo.color}`}>
                                <statusInfo.icon className="size-3" />
                                <span className="text-[10px] font-semibold">{statusInfo.label}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">Rol</span>
                            <span className="text-[10px] font-semibold text-(--beheer-text)">{signup.role === 'crew' ? 'Crew' : 'Reguliere Reiziger'}</span>
                        </div>

                        <div className="space-y-2 border-t border-white/5 pt-2">
                            <PaymentStatus
                                label="Aanbetaling"
                                isPaid={!!signup.deposit_paid}
                                date={signup.deposit_paid_at}
                            />
                            <PaymentStatus
                                label="Restbetaling"
                                isPaid={!!signup.full_payment_paid}
                                date={signup.full_payment_paid_at}
                            />
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-3 flex items-center gap-2 opacity-50">
                        <AlertCircle className="size-3 text-(--beheer-accent)" />
                        <h3 className="text-[10px] font-semibold text-(--beheer-text)">Notities</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-3">
                            <h4 className="mb-1 text-[8px] font-semibold text-red-500">Allergieën</h4>
                            <p className="text-xs leading-relaxed font-medium text-(--beheer-text)">
                                {signup.allergies || 'Geen'}
                            </p>
                        </div>
                        <div className="rounded-xl border border-(--beheer-accent)/10 bg-(--beheer-accent)/5 p-3">
                            <h4 className="mb-1 text-[8px] font-semibold text-(--beheer-accent)">Bijzonderheden</h4>
                            <p className="text-xs leading-relaxed font-medium text-(--beheer-text)">
                                {signup.special_notes || 'Geen'}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ViewField({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-white/5 py-1.5 last:border-0">
            <div className="flex items-center gap-2">
                <Icon className="size-3 text-(--beheer-text-muted) opacity-30" />
                <span className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">{label}</span>
            </div>
            <span className="max-w-50 truncate text-[11px] font-semibold text-(--beheer-text)">{value}</span>
        </div>
    );
}

function PaymentStatus({ label, isPaid, date }: { label: string; isPaid: boolean; date?: string | null }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`size-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[9px] font-semibold text-(--beheer-text-muted) opacity-50">{label}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className={`text-[10px] font-semibold ${isPaid ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPaid ? 'Betaald' : 'Niet betaald'}
                </span>
                {isPaid && date && (
                    <span className="text-[8px] font-medium text-(--beheer-text-muted) opacity-40">
                        {formatShortDate(new Date(date))}
                    </span>
                )}
            </div>
        </div>
    );
}