'use client';

import React from 'react';
import { 
    FileText, 
    CreditCard, 
    AlertCircle,
    ChevronRight,
    Bus,
    Briefcase
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { DateInput } from '@/shared/ui/DateInput';

interface SignupFormProps {
    signup: TripSignup;
    initialData?: any;
    isBusTrip?: boolean;
}

export default function SignupForm({ signup, initialData, isBusTrip }: SignupFormProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-3xl shadow-xl border border-[var(--beheer-border)] divide-y divide-[var(--beheer-border)]/20 overflow-hidden">
            {/* Personal Details */}
            <div className="p-8">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)] shadow-sm">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight">Persoonsgegevens</h2>
                        <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Basis informatie over de reiziger</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input label="Voornaam" name="first_name" defaultValue={initialData?.first_name || signup.first_name} required placeholder="Bijv. Jan" />
                    <Input label="Achternaam" name="last_name" defaultValue={initialData?.last_name || signup.last_name} required placeholder="Bijv. de Vries" />
                    <Input label="Email Adres" name="email" type="email" defaultValue={initialData?.email || signup.email} required className="md:col-span-2" placeholder="jan@voorbeeld.nl" />
                    <Input label="Telefoonnummer" name="phone_number" defaultValue={initialData?.phone_number || signup.phone_number || ''} placeholder="+31 6 12345678" />
                    <DateAndLabel label="Geboortedatum" name="date_of_birth" defaultValue={initialData?.date_of_birth || (signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '')} />
                    {!isBusTrip && (
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

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Textarea label="Allergieën / Dieet" name="allergies" defaultValue={initialData?.allergies || signup.allergies || ''} placeholder="Lijst hier allergieën of dieetwensen..." />
                    <Textarea label="Bijzonderheden" name="special_notes" defaultValue={initialData?.special_notes || signup.special_notes || ''} placeholder="Andere belangrijke informatie..." />
                </div>

                {!isBusTrip && (
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <DateAndLabel label="Vervaldatum Document" name="document_expiry_date" defaultValue={initialData?.document_expiry_date || (signup.document_expiry_date ? format(new Date(signup.document_expiry_date), 'yyyy-MM-dd') : '')} />
                        <div className="flex items-center pt-8">
                            <Checkbox label="Extra Koffer" name="extra_luggage" defaultChecked={initialData ? (initialData.extra_luggage === 'on' || initialData.extra_luggage === 'true' || initialData.extra_luggage === true) : (signup.extra_luggage || false)} />
                        </div>
                    </div>
                )}

                <div className="mt-6">
                    {isBusTrip ? (
                        <Checkbox label="Beschikbaar als chauffeur" name="willing_to_drive" defaultChecked={initialData ? (initialData.willing_to_drive === 'on' || initialData.willing_to_drive === 'true' || initialData.willing_to_drive === true) : (signup.willing_to_drive || false)} />
                    ) : (
                         <div className="flex items-center gap-3 px-4 py-3 bg-[var(--bg-main)]/30 rounded-2xl border border-[var(--beheer-border)]/20 text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">
                             <Bus className="h-4 w-4 text-[var(--beheer-accent)] opacity-50" />
                             <span>Geen chauffeur informatie nodig voor vliegreizen</span>
                         </div>
                    )}
                </div>
            </div>

            {/* Status & Payment */}
            <div className="p-8 bg-[var(--beheer-card-soft)]/20">
                <div className="flex items-center gap-4 mb-8">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)] shadow-sm">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                        <h2 className="text-xl font-bold text-[var(--beheer-text)] tracking-tight">Beheer & Betaling</h2>
                        <p className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60">Status en administratieve afhandeling</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
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

                    <div className="space-y-6">
                        <div className="p-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--beheer-border)]/50 space-y-5 shadow-inner">
                            <div className="flex items-center justify-between gap-4">
                                <Checkbox label="Aanbetaling OK" name="deposit_paid" defaultChecked={initialData ? (initialData.deposit_paid === 'on' || initialData.deposit_paid === 'true' || initialData.deposit_paid === true) : !!signup.deposit_paid} />
                                {signup.deposit_paid_at && (
                                    <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60 shrink-0">
                                        {format(new Date(signup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <Checkbox label="Restbetaling OK" name="full_payment_paid" defaultChecked={initialData ? (initialData.full_payment_paid === 'on' || initialData.full_payment_paid === 'true' || initialData.full_payment_paid === true) : !!signup.full_payment_paid} />
                                {signup.full_payment_paid_at && (
                                    <span className="text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-60 shrink-0">
                                        {format(new Date(signup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-3 px-2 text-[10px] font-semibold text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-50 italic leading-relaxed">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-[var(--beheer-accent)] opacity-50" />
                            <span>Handmatige betalingsstatus updates triggeren geen automatische e-mails naar de deelnemer.</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> {
    label: string;
}

function DateAndLabel({ label, defaultValue, name }: { label: string; defaultValue: string; name: string }) {
    const [val, setVal] = React.useState(defaultValue);
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="w-full px-5 py-4 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-2xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner"
                />
            </div>
        </div>
    );
}

function Input({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <input 
                {...props} 
                className={`w-full px-5 py-4 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-2xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner placeholder:opacity-30 ${props.className || ''}`}
            />
        </div>
    );
}

function Select({ label, children, ...props }: FieldProps & { children: React.ReactNode }) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <div className="relative group">
                <select 
                    {...props} 
                    className="w-full pl-5 pr-12 py-4 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-2xl text-[var(--beheer-text)] font-semibold text-sm focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all appearance-none cursor-pointer outline-none shadow-inner"
                >
                    {children}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors text-[var(--beheer-text-muted)] opacity-50">
                    <ChevronRight className="h-5 w-5 rotate-90" />
                </div>
            </div>
        </div>
    );
}

function Textarea({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1 opacity-70">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-5 py-4 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border border-[var(--beheer-border)]/40 rounded-2xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all resize-none min-h-[100px] font-semibold outline-none shadow-inner placeholder:opacity-30 leading-relaxed"
            />
        </div>
    );
}

function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="flex items-center gap-5 cursor-pointer group select-none">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-6 w-11 bg-[var(--beheer-border)]/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-[var(--beheer-accent)] transition-all border border-[var(--beheer-border)]/30 group-hover:border-[var(--beheer-accent)]/50 shadow-inner" />
                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-lg transform peer-active:scale-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-xs font-semibold text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors tracking-tight">{label}</span>
            </div>
        </label>
    );
}

