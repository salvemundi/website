'use client';

import React from 'react';
import { 
    FileText, 
    CreditCard, 
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import type { TripSignup } from '@salvemundi/validations/schema/admin-reis.zod';
import { DateInput } from '@/shared/ui/DateInput';

interface SignupFormProps {
    signup: TripSignup;
}

export default function SignupForm({ signup }: SignupFormProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] divide-y divide-[var(--beheer-border)]/30">
            {/* Personal Details */}
            <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-2xl flex items-center justify-center text-[var(--beheer-accent)]">
                        <FileText className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Persoonsgegevens</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Voornaam" name="first_name" defaultValue={signup.first_name} required />
                    <Input label="Achternaam" name="last_name" defaultValue={signup.last_name} required />
                    <Input label="Email" name="email" type="email" defaultValue={signup.email} required className="md:col-span-2" />
                    <Input label="Telefoon" name="phone_number" defaultValue={signup.phone_number || ''} />
                    <DateAndLabel label="Geboortedatum" name="date_of_birth" defaultValue={signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : ''} />
                    <Select label="ID Type" name="id_document" defaultValue={signup.id_document || ''}>
                        <option value="">Niet opgegeven</option>
                        <option value="passport">Paspoort</option>
                        <option value="id_card">ID Kaart</option>
                    </Select>
                    <Input label="Document Nr" name="document_number" defaultValue={signup.document_number || ''} />
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Textarea label="Allergieën / Dieetwensen" name="allergies" defaultValue={signup.allergies || ''} />
                    <Textarea label="Bijzonderheden / Opmerkingen" name="special_notes" defaultValue={signup.special_notes || ''} />
                </div>

                <div className="mt-6">
                    <Checkbox label="Willing to drive" name="willing_to_drive" defaultChecked={signup.willing_to_drive || false} />
                </div>
            </div>

            {/* Status & Payment */}
            <div className="p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-2xl flex items-center justify-center text-[var(--beheer-accent)]">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Beheer & Betaling</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <Select label="Registratie Status" name="status" defaultValue={signup.status ?? undefined}>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </Select>

                        <Select label="Gebruikersrol" name="role" defaultValue={signup.role ?? undefined}>
                            <option value="participant">Reiziger</option>
                            <option value="crew">Crew / Organisatie</option>
                        </Select>
                    </div>

                    <div className="space-y-6">
                        <div className="p-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--beheer-border)]/50 space-y-5">
                            <div className="flex items-center justify-between">
                                <Checkbox label="Aanbetaling voldaan" name="deposit_paid" defaultChecked={!!signup.deposit_paid} />
                                {signup.deposit_paid_at && (
                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                        {format(new Date(signup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <Checkbox label="Restbetaling voldaan" name="full_payment_paid" defaultChecked={!!signup.full_payment_paid} />
                                {signup.full_payment_paid_at && (
                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                        {format(new Date(signup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 px-2 text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest italic leading-relaxed">
                            <AlertCircle className="h-3 w-3 shrink-0 text-[var(--beheer-accent)]" />
                            <span>Wijzigingen in betalingsstatus sturen geen automatische emails.</span>
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
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <div className="relative">
                <DateInput 
                    name={name} 
                    value={val} 
                    onChange={(newVal) => setVal(newVal)}
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner"
                />
            </div>
        </div>
    );
}

function Input({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <input 
                {...props} 
                className={`w-full px-4 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all font-semibold outline-none shadow-inner ${props.className || ''}`}
            />
        </div>
    );
}

function Select({ label, children, ...props }: FieldProps & { children: React.ReactNode }) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <div className="relative group">
                <select 
                    {...props} 
                    className="w-full pl-4 pr-10 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 rounded-xl text-[var(--beheer-text)] font-black uppercase tracking-widest text-xs focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all appearance-none cursor-pointer outline-none shadow-inner"
                >
                    {children}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors text-[var(--beheer-text-muted)]">
                    <ChevronRight className="h-4 w-4 rotate-90" />
                </div>
            </div>
        </div>
    );
}

function Textarea({ label, ...props }: FieldProps) {
    return (
        <div className="space-y-2 group/field">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all resize-none min-h-[100px] font-semibold outline-none shadow-inner"
            />
        </div>
    );
}

function Checkbox({ label, ...props }: FieldProps) {
    return (
        <label className="flex items-center gap-4 cursor-pointer group select-none">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-6 w-11 bg-[var(--beheer-border)]/20 dark:bg-white/5 backdrop-blur-md rounded-full peer-checked:bg-[var(--beheer-accent)] transition-all border border-[var(--beheer-border)]/30 group-hover:border-[var(--beheer-accent)]/50 shadow-inner" />
                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-lg transform peer-active:scale-90" />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors uppercase tracking-widest">{label}</span>
            </div>
        </label>
    );
}
