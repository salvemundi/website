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
    initialData?: any;
}

export default function SignupForm({ signup, initialData }: SignupFormProps) {
    return (
        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] divide-y divide-[var(--beheer-border)]/30">
            {/* Personal Details */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)]">
                        <FileText className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">Persoonsgegevens</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Voornaam" name="first_name" defaultValue={initialData?.first_name || signup.first_name} required />
                    <Input label="Achternaam" name="last_name" defaultValue={initialData?.last_name || signup.last_name} required />
                    <Input label="Email" name="email" type="email" defaultValue={initialData?.email || signup.email} required className="md:col-span-2" />
                    <Input label="Telefoon" name="phone_number" defaultValue={initialData?.phone_number || signup.phone_number || ''} />
                    <DateAndLabel label="Geboortedatum" name="date_of_birth" defaultValue={initialData?.date_of_birth || (signup.date_of_birth ? format(new Date(signup.date_of_birth), 'yyyy-MM-dd') : '')} />
                    <Select label="ID Type" name="id_document" defaultValue={initialData?.id_document || signup.id_document || ''}>
                        <option value="">Niet opgegeven</option>
                        <option value="passport">Paspoort</option>
                        <option value="id_card">ID Kaart</option>
                    </Select>
                    <Input label="Document Nr" name="document_number" defaultValue={initialData?.document_number || signup.document_number || ''} />
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Textarea label="Allergieën / Dieet" name="allergies" defaultValue={initialData?.allergies || signup.allergies || ''} />
                    <Textarea label="Bijzonderheden" name="special_notes" defaultValue={initialData?.special_notes || signup.special_notes || ''} />
                </div>

                <div className="mt-5">
                    <Checkbox label="Willing to drive" name="willing_to_drive" defaultChecked={initialData ? (initialData.willing_to_drive === 'on' || initialData.willing_to_drive === 'true' || initialData.willing_to_drive === true) : (signup.willing_to_drive || false)} />
                </div>
            </div>

            {/* Status & Payment */}
            <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-9 w-9 bg-[var(--beheer-accent)]/10 rounded-xl flex items-center justify-center text-[var(--beheer-accent)]">
                        <CreditCard className="h-4.5 w-4.5" />
                    </div>
                    <h2 className="text-lg font-black text-[var(--beheer-text)] uppercase tracking-tight">Beheer & Betaling</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <Select label="Status" name="status" defaultValue={initialData?.status || signup.status || undefined}>
                            <option value="registered">Geregistreerd</option>
                            <option value="confirmed">Bevestigd</option>
                            <option value="waitlist">Wachtlijst</option>
                            <option value="cancelled">Geannuleerd</option>
                        </Select>
                        <Select label="Rol" name="role" defaultValue={initialData?.role || signup.role || undefined}>
                            <option value="participant">Reiziger</option>
                            <option value="crew">Crew / Organisatie</option>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <div className="p-5 bg-[var(--bg-main)]/50 rounded-xl border border-[var(--beheer-border)]/50 space-y-4">
                            <div className="flex items-center justify-between">
                                <Checkbox label="Aanbetaling OK" name="deposit_paid" defaultChecked={initialData ? (initialData.deposit_paid === 'on' || initialData.deposit_paid === 'true' || initialData.deposit_paid === true) : !!signup.deposit_paid} />
                                {signup.deposit_paid_at && (
                                    <span className="text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                        {format(new Date(signup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <Checkbox label="Restbetaling OK" name="full_payment_paid" defaultChecked={initialData ? (initialData.full_payment_paid === 'on' || initialData.full_payment_paid === 'true' || initialData.full_payment_paid === true) : !!signup.full_payment_paid} />
                                {signup.full_payment_paid_at && (
                                    <span className="text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                        {format(new Date(signup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-start gap-2 px-1 text-[9px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest italic leading-tight">
                            <AlertCircle className="h-2.5 w-2.5 shrink-0 text-[var(--beheer-accent)]" />
                            <span>Betalingsstatus updates sturen geen e-mails.</span>
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
        <div className="space-y-1.5 group/field">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)] group-focus-within/field:text-[var(--beheer-accent)] transition-colors px-1">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-3 bg-[var(--bg-main)]/40 dark:bg-black/20 backdrop-blur-sm border-0 ring-1 ring-[var(--beheer-border)]/40 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] focus:bg-[var(--bg-main)]/80 transition-all resize-none min-h-[80px] font-semibold outline-none shadow-inner"
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
