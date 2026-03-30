'use client';

import { useState, useTransition, useActionState } from 'react';
import { 
    Loader2, 
    Save, 
    Trash2, 
    User, 
    CreditCard, 
    Utensils, 
    CheckCircle, 
    ArrowLeft, 
    Mail, 
    AlertCircle, 
    ChevronRight, 
    FileText,
    Check
} from 'lucide-react';
import { 
    updateTripSignup, 
    deleteTripSignup, 
    updateSignupActivities 
} from '@/server/actions/admin-reis.actions';
import type { Trip, TripSignup, TripActivity } from '@salvemundi/validations';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface ReisDeelnemerDetailIslandProps {
    initialSignup: TripSignup;
    trips: Trip[];
    allActivities: TripActivity[];
    initialSelectedActivities: number[];
}

export default function ReisDeelnemerDetailIsland({ 
    initialSignup, 
    allActivities, 
    initialSelectedActivities 
}: ReisDeelnemerDetailIslandProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [state, formAction, isSaving] = useActionState(updateTripSignup.bind(null, initialSignup.id), null);
    const [selectedActivities, setSelectedActivities] = useState<number[]>(initialSelectedActivities);
    const [isUpdatingActivities, setIsUpdatingActivities] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleActivity = (id: number) => {
        setSelectedActivities(prev => 
            prev.includes(id) ? prev.filter(aid => aid !== id) : [...prev, id]
        );
    };

    const handleUpdateActivities = async () => {
        setIsUpdatingActivities(true);
        try {
            const res = await updateSignupActivities(initialSignup.id, selectedActivities);
            if (!res.success) {
                setError(res.error || 'Fout bij het bijwerken van activiteiten');
            }
        } catch (err) {
            setError('Geen verbinding met de server');
        } finally {
            setIsUpdatingActivities(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Weet je zeker dat je deze deelnemer wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
        
        startTransition(async () => {
            const res = await deleteTripSignup(initialSignup.id);
            if (res.success) {
                router.push('/beheer/reis');
            } else {
                setError(res.error || 'Verwijderen mislukt');
            }
        });
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-700">
            {state?.success && (
                <div className="mb-8 p-6 bg-[var(--beheer-active)]/10 text-[var(--beheer-active)] rounded-[var(--beheer-radius)] border border-[var(--beheer-active)]/20 flex items-center gap-4 animate-in slide-in-from-top-4 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-[var(--beheer-active)] text-white flex items-center justify-center shadow-lg shadow-[var(--beheer-active)]/20">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="font-black uppercase tracking-tight text-sm">Update geslaagd!</p>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80">De wijzigingen zijn succesvol verwerkt.</p>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-[var(--radius-xl)] border border-[var(--theme-error)]/20 flex items-center gap-3 animate-in slide-in-from-top-4">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            <form action={formAction} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Personal Info & Status */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Header Card */}
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] p-8 overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                                <User className="h-40 w-40" />
                            </div>
                            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                <div className="flex items-center gap-6">
                                    <div className="h-20 w-20 rounded-3xl bg-[var(--beheer-accent)]/10 text-[var(--beheer-accent)] flex items-center justify-center shadow-inner">
                                        <User className="h-10 w-10" />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-black text-[var(--beheer-text)] uppercase tracking-tight">
                                            {initialSignup.first_name} {initialSignup.last_name}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Mail className="h-3.5 w-3.5 text-[var(--beheer-text-muted)]" />
                                            <span className="text-sm font-black text-[var(--beheer-text-muted)] uppercase tracking-widest">{initialSignup.email}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-col gap-3 shrink-0 sm:items-end">
                                    <StatusBadge status={initialSignup.status} />
                                    <span className="px-4 py-1.5 bg-[var(--bg-main)] rounded-xl text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest text-center border border-[var(--beheer-border)]/50 shadow-sm">
                                        Rol: <span className="text-[var(--beheer-text)]">{initialSignup.role}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Form Sections */}
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
                                    <Input label="Voornaam" name="first_name" defaultValue={initialSignup.first_name} required />
                                    <Input label="Achternaam" name="last_name" defaultValue={initialSignup.last_name} required />
                                    <Input label="Email" name="email" type="email" defaultValue={initialSignup.email} required className="md:col-span-2" />
                                    <Input label="Telefoon" name="phone_number" defaultValue={initialSignup.phone_number || ''} />
                                    <Input label="Geboortedatum" name="date_of_birth" type="date" defaultValue={initialSignup.date_of_birth ? format(new Date(initialSignup.date_of_birth), 'yyyy-MM-dd') : ''} />
                                    <Select label="ID Type" name="id_document" defaultValue={initialSignup.id_document || ''}>
                                        <option value="">Niet opgegeven</option>
                                        <option value="passport">Paspoort</option>
                                        <option value="id_card">ID Kaart</option>
                                    </Select>
                                    <Input label="Document Nr" name="document_number" defaultValue={initialSignup.document_number || ''} />
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Textarea label="Allergieën / Dieetwensen" name="allergies" defaultValue={initialSignup.allergies || ''} />
                                    <Textarea label="Bijzonderheden / Opmerkingen" name="special_notes" defaultValue={initialSignup.special_notes || ''} />
                                </div>

                                <div className="mt-6">
                                    <Checkbox label="Willing to drive" name="willing_to_drive" defaultChecked={initialSignup.willing_to_drive || false} />
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
                                        <Select label="Registratie Status" name="status" defaultValue={initialSignup.status}>
                                            <option value="registered">Geregistreerd</option>
                                            <option value="confirmed">Bevestigd</option>
                                            <option value="waitlist">Wachtlijst</option>
                                            <option value="cancelled">Geannuleerd</option>
                                        </Select>

                                        <Select label="Gebruikersrol" name="role" defaultValue={initialSignup.role}>
                                            <option value="participant">Deelnemer</option>
                                            <option value="crew">Crew / Organisatie</option>
                                        </Select>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="p-6 bg-[var(--bg-main)]/50 rounded-2xl border border-[var(--beheer-border)]/50 space-y-5">
                                            <div className="flex items-center justify-between">
                                                <Checkbox label="Aanbetaling voldaan" name="deposit_paid" defaultChecked={initialSignup.deposit_paid} />
                                                {initialSignup.deposit_paid_at && (
                                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                                        {format(new Date(initialSignup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Checkbox label="Restbetaling voldaan" name="full_payment_paid" defaultChecked={initialSignup.full_payment_paid} />
                                                {initialSignup.full_payment_paid_at && (
                                                    <span className="text-[10px] font-black text-[var(--beheer-text-muted)] uppercase tracking-widest opacity-80">
                                                        {format(new Date(initialSignup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
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
                    </div>

                    {/* Right Column: Activities & Actions */}
                    <div className="space-y-8">
                        {/* Activity Box */}
                        <div className="bg-[var(--beheer-card-bg)] rounded-[var(--beheer-radius)] shadow-xl border border-[var(--beheer-border)] p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-[var(--beheer-accent)]/10 rounded-2xl flex items-center justify-center text-[var(--beheer-accent)]">
                                        <Utensils className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-xl font-black text-[var(--beheer-text)] uppercase tracking-tight">Activiteiten</h2>
                                </div>
                            </div>

                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {allActivities.length === 0 ? (
                                    <p className="text-xs font-black uppercase tracking-widest text-[var(--beheer-text-muted)] text-center py-12">Geen activiteiten geconfigureerd.</p>
                                ) : allActivities.map(activity => (
                                    <label 
                                        key={activity.id}
                                        className={`flex items-center justify-between p-5 rounded-2xl cursor-pointer transition-all border-2 ${
                                            selectedActivities.includes(activity.id) 
                                                ? 'bg-[var(--beheer-accent)] border-[var(--beheer-accent)] shadow-lg shadow-[var(--beheer-accent)]/20 text-white' 
                                                : 'bg-[var(--bg-main)]/50 border-[var(--beheer-border)]/50 hover:border-[var(--beheer-accent)]/50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`h-5 w-5 rounded-lg flex items-center justify-center transition-all ${
                                                selectedActivities.includes(activity.id) ? 'bg-white text-[var(--beheer-accent)]' : 'bg-[var(--beheer-border)]/20 text-transparent'
                                            }`}>
                                                <Check className="h-3.5 w-3.5" />
                                            </div>
                                            <span className={`text-sm font-black uppercase tracking-tight transition-all ${
                                                selectedActivities.includes(activity.id) ? 'text-white' : 'text-[var(--beheer-text)]'
                                            }`}>
                                                {activity.name}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                selectedActivities.includes(activity.id) ? 'text-white/80' : 'text-[var(--beheer-accent)]'
                                            }`}>
                                                €{activity.price.toFixed(2)}
                                            </span>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedActivities.includes(activity.id)} 
                                                onChange={() => toggleActivity(activity.id)}
                                                className="sr-only"
                                            />
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={handleUpdateActivities}
                                disabled={isUpdatingActivities}
                                className="mt-6 w-full py-4 bg-[var(--bg-main)] hover:bg-[var(--beheer-accent)]/10 text-[var(--beheer-text)] hover:text-[var(--beheer-accent)] rounded-[var(--beheer-radius)] font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 border border-[var(--beheer-border)] hover:border-[var(--beheer-accent)]/30"
                            >
                                {isUpdatingActivities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Activiteiten Bijwerken
                            </button>
                        </div>

                        {/* Meta Stats */}
                        <div className="bg-[var(--beheer-card-bg)]/50 backdrop-blur-sm rounded-[var(--beheer-radius)] border border-[var(--beheer-border)] p-6 space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                <span>Aangemeld op</span>
                                <span className="text-[var(--beheer-text)]">{initialSignup.date_created ? format(new Date(initialSignup.date_created), 'd MMM yyyy HH:mm', { locale: nl }) : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text-muted)]">
                                <span>Deelnemer ID</span>
                                <span className="text-[var(--beheer-text)]">#{initialSignup.id}</span>
                            </div>
                        </div>

                        {/* Final Actions */}
                        <div className="space-y-4 pt-4">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-[var(--beheer-btn-py)] bg-[var(--beheer-accent)] hover:opacity-95 text-white rounded-[var(--beheer-radius)] font-black uppercase tracking-widest text-lg shadow-2xl shadow-[var(--beheer-accent)]/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 group"
                            >
                                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 group-hover:scale-110 transition-transform" />}
                                <span>Opslaan</span>
                            </button>
                            
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => router.push('/beheer/reis')}
                                    className="flex-1 py-4 bg-[var(--bg-main)] hover:bg-[var(--beheer-border)]/10 text-[var(--beheer-text-muted)] hover:text-[var(--beheer-text)] rounded-2xl font-black uppercase tracking-widest text-[10px] border border-[var(--beheer-border)] transition-all flex items-center justify-center gap-3"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Annuleren
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={isPending}
                                    className="p-4 bg-[var(--beheer-inactive)]/5 hover:bg-[var(--beheer-inactive)]/10 text-[var(--beheer-inactive)] rounded-2xl border border-[var(--beheer-inactive)]/20 transition-all shadow-sm"
                                >
                                    {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

function Input({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] px-1">{label}</label>
            <input 
                {...props} 
                className={`w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all font-semibold ${props.className || ''}`}
            />
        </div>
    );
}

function Select({ label, children, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] px-1">{label}</label>
            <div className="relative group">
                <select 
                    {...props} 
                    className="w-full pl-4 pr-10 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-[var(--beheer-text)] font-black uppercase tracking-widest text-xs focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all appearance-none cursor-pointer"
                >
                    {children}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 h-4 w-4 text-[var(--beheer-text-muted)] pointer-events-none group-hover:text-[var(--beheer-accent)] transition-colors" />
            </div>
        </div>
    );
}

function Textarea({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--beheer-text)] px-1">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-3 bg-[var(--bg-main)]/50 border-0 ring-1 ring-[var(--beheer-border)]/50 rounded-xl text-sm text-[var(--beheer-text)] focus:ring-2 focus:ring-[var(--beheer-accent)] transition-all resize-none min-h-[100px] font-semibold"
            />
        </div>
    );
}

function Checkbox({ label, ...props }: any) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-6 w-11 bg-[var(--beheer-border)]/30 rounded-full peer-checked:bg-[var(--beheer-accent)] transition-all border border-[var(--beheer-border)]/20" />
                <div className="absolute left-1 top-1 h-4 w-4 bg-white rounded-full transition-all peer-checked:left-6 shadow-sm" />
            </div>
            <span className="text-[10px] font-black text-[var(--beheer-text-muted)] group-hover:text-[var(--beheer-text)] transition-colors uppercase tracking-widest">{label}</span>
        </label>
    );
}

function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string, color: string }> = {
        registered: { label: 'Geregistreerd', color: 'var(--beheer-accent)' },
        confirmed: { label: 'Bevestigd', color: 'var(--beheer-active)' },
        waitlist: { label: 'Wachtlijst', color: '#f59e0b' },
        cancelled: { label: 'Geannuleerd', color: 'var(--beheer-inactive)' }
    };

    const config = configs[status] || { label: status, color: 'var(--beheer-text-muted)' };

    return (
        <span 
            className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-center shadow-sm"
            style={{ 
                backgroundColor: `${config.color}15`, 
                color: config.color,
                border: `1px solid ${config.color}30`
            }}
        >
            Status: {config.label}
        </span>
    );
}
