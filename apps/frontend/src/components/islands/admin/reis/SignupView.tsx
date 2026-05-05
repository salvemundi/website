'use client';

import React from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { 
    User, 
    Mail, 
    Phone, 
    Calendar, 
    FileText, 
    AlertCircle, 
    StickyNote,
    CreditCard,
    CheckCircle2,
    Clock,
    XCircle,
    Bus,
    Briefcase
} from 'lucide-react';

interface SignupViewProps {
    signup: TripSignup;
    isBusTrip?: boolean;
}

export default function SignupView({ signup, isBusTrip }: SignupViewProps) {
    const getStatusInfo = (status: string | null | undefined) => {
        switch (status) {
            case 'confirmed': return { icon: CheckCircle2, color: 'text-emerald-500', label: 'Bevestigd' };
            case 'waitlist': return { icon: Clock, color: 'text-yellow-500', label: 'Wachtlijst' };
            case 'cancelled': return { icon: XCircle, color: 'text-red-500', label: 'Geannuleerd' };
            default: return { icon: AlertCircle, color: 'text-[var(--beheer-accent)]', label: 'Geregistreerd' };
        }
    };

    const statusInfo = getStatusInfo(signup.status);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-2">
            {/* Left Column: Personal Info */}
            <div className="space-y-6">
                <section>
                    <div className="flex items-center gap-2 mb-3 opacity-50">
                        <User className="h-3 w-3 text-[var(--beheer-accent)]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--beheer-text)]">REIZIGER</h3>
                    </div>
                    <div className="bg-[var(--bg-main)]/30 rounded-2xl border border-[var(--beheer-border)]/10 p-4 space-y-3 shadow-inner">
                        <ViewField label="Naam" value={`${signup.first_name} ${signup.last_name}`} icon={User} />
                        <ViewField label="Email" value={signup.email} icon={Mail} />
                        <ViewField label="Telefoon" value={signup.phone_number || 'Niet opgegeven'} icon={Phone} />
                        <ViewField 
                            label="Geb. Datum" 
                            value={signup.date_of_birth ? format(new Date(signup.date_of_birth), 'd MMMM yyyy', { locale: nl }) : 'Niet opgegeven'} 
                            icon={Calendar} 
                        />
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-3 opacity-50">
                        {isBusTrip ? <Bus className="h-3 w-3 text-[var(--beheer-accent)]" /> : <FileText className="h-3 w-3 text-[var(--beheer-accent)]" />}
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--beheer-text)]">{isBusTrip ? 'VERVOER' : 'DOCUMENTEN'}</h3>
                    </div>
                    <div className="bg-[var(--bg-main)]/30 rounded-2xl border border-[var(--beheer-border)]/10 p-4 space-y-3 shadow-inner">
                        {isBusTrip ? (
                            <div className={`px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-widest flex items-center justify-between border ${signup.willing_to_drive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                <div className="flex items-center gap-2">
                                    <Bus className="h-3.5 w-3.5" />
                                    <span>Chauffeur</span>
                                </div>
                                <span>{signup.willing_to_drive ? 'BESCHIKBAAR' : 'NEE'}</span>
                            </div>
                        ) : (
                            <>
                                <ViewField label="ID Type" value={signup.id_document === 'passport' ? 'Paspoort' : signup.id_document === 'id_card' ? 'ID Kaart' : 'Niet opgegeven'} icon={FileText} />
                                <ViewField label="ID Nummer" value={signup.document_number || 'Niet opgegeven'} icon={Briefcase} />
                                <ViewField 
                                    label="Vervaldatum" 
                                    value={signup.document_expiry_date ? format(new Date(signup.document_expiry_date), 'd MMM yyyy', { locale: nl }) : 'Niet opgegeven'} 
                                    icon={Calendar} 
                                />
                                <ViewField label="Extra Koffer" value={signup.extra_luggage ? 'Ja' : 'Nee'} icon={Briefcase} />
                            </>
                        )}
                    </div>
                </section>
            </div>

            {/* Right Column: Status & Notes */}
            <div className="space-y-6">
                <section>
                    <div className="flex items-center gap-2 mb-3 opacity-50">
                        <CreditCard className="h-3 w-3 text-[var(--beheer-accent)]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--beheer-text)]">STATUS</h3>
                    </div>
                    <div className="bg-[var(--bg-main)]/30 rounded-2xl border border-[var(--beheer-border)]/10 p-4 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">Status</span>
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 ${statusInfo.color}`}>
                                <statusInfo.icon className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{statusInfo.label}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">Rol</span>
                            <span className="text-[10px] font-bold text-[var(--beheer-text)]">{signup.role === 'crew' ? 'Crew' : 'Reguliere Reiziger'}</span>
                        </div>
                        
                        <div className="pt-2 space-y-2 border-t border-white/5">
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
                    <div className="flex items-center gap-2 mb-3 opacity-50">
                        <AlertCircle className="h-3 w-3 text-[var(--beheer-accent)]" />
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--beheer-text)]">NOTITIES</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="bg-red-500/5 rounded-xl border border-red-500/10 p-3">
                            <h4 className="text-[8px] font-bold uppercase tracking-widest text-red-500 mb-1">Allergieën</h4>
                            <p className="text-xs text-[var(--beheer-text)] font-medium leading-relaxed">
                                {signup.allergies || 'Geen'}
                            </p>
                        </div>
                        <div className="bg-[var(--beheer-accent)]/5 rounded-xl border border-[var(--beheer-accent)]/10 p-3">
                            <h4 className="text-[8px] font-bold uppercase tracking-widest text-[var(--beheer-accent)] mb-1">Bijzonderheden</h4>
                            <p className="text-xs text-[var(--beheer-text)] font-medium leading-relaxed">
                                {signup.special_notes || 'Geen'}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ViewField({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
    return (
        <div className="flex items-center justify-between gap-4 py-1.5 border-b border-white/5 last:border-0">
            <div className="flex items-center gap-2">
                <Icon className="h-3 w-3 text-[var(--beheer-text-muted)] opacity-30" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">{label}</span>
            </div>
            <span className="text-[11px] font-semibold text-[var(--beheer-text)] truncate max-w-[200px]">{value}</span>
        </div>
    );
}

function PaymentStatus({ label, isPaid, date }: { label: string; isPaid: boolean; date?: string | null }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${isPaid ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--beheer-text-muted)] opacity-50">{label}</span>
            </div>
            <div className="flex flex-col items-end">
                <span className={`text-[10px] font-bold ${isPaid ? 'text-emerald-500' : 'text-red-500'}`}>
                    {isPaid ? 'Betaald' : 'Niet betaald'}
                </span>
                {isPaid && date && (
                    <span className="text-[8px] font-medium text-[var(--beheer-text-muted)] opacity-40">
                        {format(new Date(date), 'd MMM yyyy', { locale: nl })}
                    </span>
                )}
            </div>
        </div>
    );
}
