'use client';

import React from 'react';
import { FileText, CreditCard, Bus, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { parseBoolean } from '@salvemundi/validations';
import { 
    Input, 
    Select, 
    Textarea, 
    Checkbox, 
    DateAndLabel 
} from './TripSignupFormFields';

interface StandardSignupFormProps {
    signup: TripSignup;
    initialData?: Partial<TripSignup>;
    isBusTrip?: boolean;
    minimal?: boolean;
    section?: 'all' | 'personal' | 'admin' | 'personal_basic' | 'personal_extended';
    compact?: boolean;
}

export default function StandardSignupForm({ 
    signup, 
    initialData, 
    isBusTrip, 
    minimal = false, 
    section = 'all',
    compact = true
}: StandardSignupFormProps) {
    return (
        <div className={`${minimal ? (compact ? 'space-y-6' : 'space-y-12') : 'bg-[var(--beheer-card-bg)] rounded-3xl shadow-xl border border-[var(--beheer-border)] divide-y divide-[var(--beheer-border)]/20 overflow-hidden'}`}>
            {/* Personal Details */}
            {(section === 'all' || section === 'personal' || section === 'personal_basic' || section === 'personal_extended') && (
                <div className={`${minimal ? '' : 'p-8'}`}>
                    <div className={`flex items-center gap-4 ${compact ? 'mb-4' : 'mb-8'}`}>
                        <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)] shadow-sm">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-[var(--beheer-text)] tracking-tight`}>Persoonsgegevens</h2>
                            <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-60">Basis informatie over de reiziger</p>
                        </div>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 ${compact ? 'gap-4' : 'gap-8'}`}>
                        {(section === 'all' || section === 'personal' || section === 'personal_basic') && (
                            <>
                                <Input label="Voornaam" name="first_name" defaultValue={initialData?.first_name || signup.first_name} required placeholder="Bijv. Jan" />
                                <Input label="Achternaam" name="last_name" defaultValue={initialData?.last_name || signup.last_name} required placeholder="Bijv. de Vries" />
                                <Input label="Email Adres" name="email" type="email" defaultValue={initialData?.email || signup.email} required className="md:col-span-2" placeholder="jan@voorbeeld.nl" />
                                <Input label="Telefoonnummer" name="phone_number" defaultValue={initialData?.phone_number || signup.phone_number || ''} placeholder="+31 6 12345678" />
                                <DateAndLabel label="Geboortedatum" name="date_of_birth" defaultValue={initialData?.date_of_birth || (signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '')} />
                            </>
                        )}
                        {(section === 'all' || section === 'personal' || section === 'personal_extended') && !isBusTrip && (
                            <>
                                <Select label="Type ID Bewijs" name="id_document" defaultValue={initialData?.id_document || signup.id_document || ''}>
                                    <option value="">Niet opgegeven</option>
                                    <option value="passport">Paspoort</option>
                                    <option value="id_card">Identiteitskaart (ID)</option>
                                </Select>
                                <Input label="Document Nummer" name="document_number" defaultValue={initialData?.document_number || signup.document_number || ''} placeholder="ID of Paspoort nr" />
                            </>
                        )}
                    </div>

                    {(section === 'all' || section === 'personal' || section === 'personal_extended') && (
                        <>
                            <div className={`${compact ? 'mt-4' : 'mt-8'} grid grid-cols-1 md:grid-cols-2 ${compact ? 'gap-4' : 'gap-8'}`}>
                                <Textarea label="Allergieën / Dieet" name="allergies" defaultValue={initialData?.allergies || signup.allergies || ''} placeholder="Lijst hier allergieën of dieetwensen..." />
                                <Textarea label="Bijzonderheden" name="special_notes" defaultValue={initialData?.special_notes || signup.special_notes || ''} placeholder="Andere belangrijke informatie..." />
                            </div>

                            {!isBusTrip && (
                                <div className={`${compact ? 'mt-4' : 'mt-8'} grid grid-cols-1 md:grid-cols-2 ${compact ? 'gap-4' : 'gap-8'}`}>
                                    <DateAndLabel label="Vervaldatum Document" name="document_expiry_date" defaultValue={initialData?.document_expiry_date || (signup.document_expiry_date ? format(new Date(signup.document_expiry_date), 'yyyy-MM-dd') : '')} />
                                    <div className="flex items-center pt-4">
                                        <Checkbox label="Extra Koffer" name="extra_luggage" defaultChecked={initialData ? parseBoolean(initialData.extra_luggage) : parseBoolean(signup.extra_luggage)} />
                                    </div>
                                </div>
                            )}

                            <div className={`${compact ? 'mt-4' : 'mt-6'}`}>
                                {isBusTrip ? (
                                    <Checkbox label="Beschikbaar als chauffeur" name="willing_to_drive" defaultChecked={initialData ? parseBoolean(initialData.willing_to_drive) : parseBoolean(signup.willing_to_drive)} />
                                ) : (
                                    <div className="flex items-center gap-3 px-3 py-2 bg-[var(--bg-main)]/30 rounded-xl border border-[var(--beheer-border)]/20 text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-60">
                                        <Bus className="h-4 w-4 text-[var(--beheer-accent)] opacity-50" />
                                        <span>Geen chauffeur informatie nodig voor vliegreizen</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Status & Payment */}
            {(section === 'all' || section === 'admin') && (
                <div className={`${(minimal && section === 'all') ? (compact ? 'pt-6' : 'pt-8') + ' border-t border-[var(--beheer-border)]/20' : minimal ? '' : 'p-8 bg-[var(--beheer-card-soft)]/20'}`}>
                    <div className={`flex items-center gap-4 ${compact ? 'mb-4' : 'mb-8'}`}>
                        <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)] shadow-sm">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                            <h2 className={`${compact ? 'text-lg' : 'text-xl'} font-semibold text-[var(--beheer-text)] tracking-tight`}>Beheer & Betaling</h2>
                            <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-60">Status en administratieve afhandeling</p>
                        </div>
                    </div>
                    <div className={`grid grid-cols-1 md:grid-cols-2 ${compact ? 'gap-6' : 'gap-10'}`}>
                        <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
                            <Select label="Registratie Status" name="status" defaultValue={initialData?.status || signup.status || undefined}>
                                <option value="registered">Geregistreerd (Nieuw)</option>
                                <option value="confirmed">Bevestigd (Gaat mee)</option>
                                <option value="waitlist">Wachtlijst</option>
                                <option value="cancelled">Geannuleerd</option>
                            </Select>
                            <Select label="Deelnemer Rol" name="role" defaultValue={initialData?.role || signup.role || undefined}>
                                <option value="participant">Reguliere Reiziger</option>
                                <option value="crew">Crew / Organisatie</option>
                            </Select>
                        </div>

                        <div className={`${compact ? 'space-y-4' : 'space-y-6'}`}>
                            <div className={`${compact ? 'p-4' : 'p-6'} bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--beheer-border)]/50 ${compact ? 'space-y-4' : 'space-y-5'} shadow-inner`}>
                                <div className="flex items-center justify-between gap-4">
                                    <Checkbox label="Aanbetaling OK" name="deposit_paid" defaultChecked={initialData ? parseBoolean(initialData.deposit_paid) : parseBoolean(signup.deposit_paid)} />
                                    {signup.deposit_paid_at && (
                                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-60 shrink-0">
                                            {format(new Date(signup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                    <Checkbox label="Restbetaling OK" name="full_payment_paid" defaultChecked={initialData ? parseBoolean(initialData.full_payment_paid) : parseBoolean(signup.full_payment_paid)} />
                                    {signup.full_payment_paid_at && (
                                        <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-60 shrink-0">
                                            {format(new Date(signup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-start gap-3 px-2 text-[10px] font-semibold text-[var(--beheer-text-muted)] opacity-50 italic leading-relaxed">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[var(--beheer-accent)] opacity-50" />
                                <span>Betalingsstatus updates triggeren geen e-mails.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
