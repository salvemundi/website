'use client';

import React from 'react';
import type { TripSignup } from '@salvemundi/validations';
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
            case 'confirmed': return { icon: CheckCircle2, color: 'text-theme-success', label: 'Bevestigd' };
            case 'waitlist': return { icon: Clock, color: 'text-geel', label: 'Wachtlijst' };
            case 'cancelled': return { icon: XCircle, color: 'text-theme-error', label: 'Geannuleerd' };
            default: return { icon: AlertCircle, color: 'text-beheer-accent', label: 'Geregistreerd' };
        }
    };

    const statusInfo = getStatusInfo(signup.status);

    return (
        <div className="signup-view-grid">
            <div className="space-y-6">
                <section>
                    <div className="signup-section-header">
                        <User className="size-3 text-beheer-accent" />
                        <h3 className="text-2xs font-semibold text-beheer-text">Reiziger</h3>
                    </div>
                    <div className="signup-section-card">
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
                    <div className="signup-section-header">
                        {isBusTrip ? <Bus className="size-3 text-beheer-accent" /> : <FileText className="size-3 text-beheer-accent" />}
                        <h3 className="text-2xs font-semibold text-beheer-text">{isBusTrip ? 'Vervoer' : 'Documenten'}</h3>
                    </div>
                    <div className="signup-section-card">
                        {isBusTrip ? (
                            <div className={signup.willing_to_drive ? 'signup-driver-badge-available' : 'signup-driver-badge-unavailable'}>
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
                    <div className="signup-section-header">
                        <CreditCard className="size-3 text-beheer-accent" />
                        <h3 className="text-2xs font-semibold text-beheer-text">Status</h3>
                    </div>
                    <div className="signup-status-card">
                        <div className="flex items-center justify-between">
                            <span className="text-2xs font-semibold text-beheer-text-muted opacity-50">Status</span>
                            <div className={`signup-status-pill ${statusInfo.color}`}>
                                <statusInfo.icon className="size-3" />
                                <span className="text-2xs font-semibold">{statusInfo.label}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-2xs font-semibold text-beheer-text-muted opacity-50">Rol</span>
                            <span className="text-2xs font-semibold text-beheer-text">{signup.role === 'crew' ? 'Crew' : 'Reguliere Reiziger'}</span>
                        </div>

                        <div className="space-y-2 border-t border-beheer-border/10 pt-2">
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
                    <div className="signup-section-header">
                        <AlertCircle className="size-3 text-beheer-accent" />
                        <h3 className="text-2xs font-semibold text-beheer-text">Notities</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="signup-note-error">
                            <h4 className="mb-1 text-2xs font-semibold text-theme-error">Allergieën</h4>
                            <p className="text-xs leading-relaxed font-medium text-beheer-text">
                                {signup.allergies || 'Geen'}
                            </p>
                        </div>
                        <div className="signup-note-accent">
                            <h4 className="mb-1 text-2xs font-semibold text-beheer-accent">Bijzonderheden</h4>
                            <p className="text-xs leading-relaxed font-medium text-beheer-text">
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
        <div className="view-field-row">
            <div className="flex items-center gap-2">
                <Icon className="size-4 text-theme-purple" />
                <span className="font-semibold text-text-muted">{label}</span>
            </div>
            <span className="max-w-60 truncate font-bold text-text-main">{value}</span>
        </div>
    );
}

function PaymentStatus({ label, isPaid, date }: { label: string; isPaid: boolean; date?: string | null }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-2">
                <div className={`size-2 rounded-full ${isPaid ? 'bg-theme-success' : 'bg-theme-error'}`} />
                <span className="text-xs font-semibold text-text-muted">{label}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className={`text-xs font-bold ${isPaid ? 'text-theme-success' : 'text-theme-error'}`}>
                    {isPaid ? 'Betaald' : 'Niet betaald'}
                </span>
                {isPaid && date && (
                    <span className="text-2xs font-medium text-text-muted">
                        {formatShortDate(new Date(date))}
                    </span>
                )}
            </div>
        </div>
    );
}