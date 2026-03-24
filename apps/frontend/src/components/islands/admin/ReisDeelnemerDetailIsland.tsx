'use client';

import { useState, useTransition, useActionState, useOptimistic } from 'react';
import { 
    Loader2, 
    Save, 
    Trash2, 
    User, 
    Calendar, 
    CreditCard, 
    Utensils, 
    Info,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Phone,
    Mail,
    AlertCircle,
    ChevronRight,
    Clock,
    FileText
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
    trips, 
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
            if (res.success) {
                // Done
            } else {
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
                <div className="mb-6 p-4 bg-[var(--theme-success)]/10 text-[var(--theme-success)] rounded-[var(--radius-xl)] border border-[var(--theme-success)]/20 flex items-center gap-3 animate-in slide-in-from-top-4">
                    <CheckCircle className="h-5 w-5" />
                    <p className="font-semibold">Wijzigingen succesvol opgeslagen!</p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-[var(--radius-xl)] border border-[var(--theme-error)]/20 flex items-center gap-3 animate-in slide-in-from-top-4">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}

            <form action={formAction} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Personal Info & Status */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Header Card */}
                    <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] p-8 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <User className="h-32 w-32" />
                        </div>
                        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-20 w-20 rounded-3xl bg-[var(--theme-purple)]/10 text-[var(--theme-purple)] flex items-center justify-center shadow-inner">
                                    <User className="h-10 w-10 font-bold" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-[var(--text-main)] italic">
                                        {initialSignup.first_name} {initialSignup.last_name}
                                    </h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Mail className="h-3 w-3 text-[var(--text-muted)]" />
                                        <span className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest">{initialSignup.email}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                                <span className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest text-center shadow-sm ${
                                    initialSignup.status === 'confirmed' ? 'bg-[var(--theme-success)]/10 text-[var(--theme-success)] ring-1 ring-[var(--theme-success)]/20' :
                                    initialSignup.status === 'waitlist' ? 'bg-[var(--theme-warning)]/10 text-[var(--theme-warning)] ring-1 ring-[var(--theme-warning)]/20' :
                                    initialSignup.status === 'cancelled' ? 'bg-[var(--theme-error)]/10 text-[var(--theme-error)] ring-1 ring-[var(--theme-error)]/20' :
                                    'bg-[var(--theme-info)]/10 text-[var(--theme-info)] ring-1 ring-[var(--theme-info)]/20'
                                }`}>
                                    Status: {initialSignup.status}
                                </span>
                                <span className="px-4 py-2 bg-[var(--bg-main)] rounded-xl text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest text-center ring-1 ring-[var(--border-color)]/30">
                                    Rol: {initialSignup.role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Form Sections */}
                    <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] divide-y divide-[var(--border-color)]/20">
                        {/* Personal Details */}
                        <div className="p-8">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2 bg-[var(--bg-main)] rounded-lg ring-1 ring-[var(--border-color)]/30">
                                    <FileText className="h-5 w-5 text-[var(--theme-purple)]" />
                                </div>
                                <h2 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-widest italic">Persoonsgegevens</h2>
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
                                <div className="p-2 bg-[var(--bg-main)] rounded-lg ring-1 ring-[var(--border-color)]/30">
                                    <CreditCard className="h-5 w-5 text-[var(--theme-purple)]" />
                                </div>
                                <h2 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-widest italic">Beheer & Betaling</h2>
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
                                    <div className="p-4 bg-[var(--bg-main)] rounded-2xl ring-1 ring-[var(--border-color)]/30 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Checkbox label="Aanbetaling voldaan" name="deposit_paid" defaultChecked={initialSignup.deposit_paid} />
                                            {initialSignup.deposit_paid_at && (
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] italic">
                                                    {format(new Date(initialSignup.deposit_paid_at), 'd MMM yyyy', { locale: nl })}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Checkbox label="Restbetaling voldaan" name="full_payment_paid" defaultChecked={initialSignup.full_payment_paid} />
                                            {initialSignup.full_payment_paid_at && (
                                                <span className="text-[10px] font-bold text-[var(--text-muted)] italic">
                                                    {format(new Date(initialSignup.full_payment_paid_at), 'd MMM yyyy', { locale: nl })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-muted)] italic px-2">
                                        * Let op: Wijzigingen in betalingsstatus sturen geen automatische emails in deze interface.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Activities & Actions */}
                <div className="space-y-8">
                    {/* Activity Box */}
                    <div className="bg-[var(--bg-card)] rounded-[var(--radius-2xl)] shadow-[var(--shadow-card)] ring-1 ring-[var(--border-color)] p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--bg-main)] rounded-lg ring-1 ring-[var(--border-color)]/30">
                                    <Utensils className="h-5 w-5 text-[var(--theme-purple)]" />
                                </div>
                                <h2 className="text-lg font-bold text-[var(--text-main)] uppercase tracking-widest italic">Activiteiten</h2>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                            {allActivities.length === 0 ? (
                                <p className="text-sm italic text-[var(--text-muted)] text-center py-8">Geen activiteiten geconfigureerd.</p>
                            ) : allActivities.map(activity => (
                                <label 
                                    key={activity.id}
                                    className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all ring-1 ${
                                        selectedActivities.includes(activity.id) 
                                            ? 'bg-[var(--theme-purple)]/5 ring-[var(--theme-purple)]/30 shadow-sm' 
                                            : 'bg-[var(--bg-main)]/30 ring-[var(--border-color)]/20 hover:ring-[var(--theme-purple)]/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`h-2 w-2 rounded-full transition-all ${
                                            selectedActivities.includes(activity.id) ? 'bg-[var(--theme-purple)] scale-125' : 'bg-[var(--text-light)]/30'
                                        }`} />
                                        <span className={`text-sm font-bold transition-all ${
                                            selectedActivities.includes(activity.id) ? 'text-[var(--text-main)]' : 'text-[var(--text-subtle)]'
                                        }`}>
                                            {activity.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-[10px] font-bold text-[var(--theme-purple)]">€{activity.price.toFixed(2)}</span>
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
                            className="mt-6 w-full py-3 bg-[var(--bg-main)] hover:bg-[var(--border-color)]/20 text-[var(--text-main)] rounded-xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ring-1 ring-[var(--border-color)]/30"
                        >
                            {isUpdatingActivities ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Activiteiten Bijwerken
                        </button>
                    </div>

                    {/* Meta Stats */}
                    <div className="bg-[var(--bg-card)]/50 backdrop-blur-sm rounded-[var(--radius-2xl)] ring-1 ring-[var(--border-color)] p-6 space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            <span>Aangemeld op</span>
                             <span className="text-[var(--text-main)]">{initialSignup.date_created ? format(new Date(initialSignup.date_created), 'd MMM yyyy HH:mm', { locale: nl }) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            <span>Deelnemer ID</span>
                            <span className="text-[var(--text-main)]">#{initialSignup.id}</span>
                        </div>
                    </div>

                    {/* Final Actions */}
                    <div className="space-y-4 pt-4">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-5 bg-[var(--theme-purple)] hover:opacity-90 text-white rounded-[var(--radius-xl)] font-bold shadow-xl shadow-[var(--theme-purple)]/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 overflow-hidden group"
                        >
                            {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 group-hover:scale-110 transition-transform" />}
                            <span className="text-lg italic">Opslaan</span>
                        </button>
                        
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.push('/beheer/reis')}
                                className="flex-1 py-4 bg-[var(--bg-card)] hover:bg-[var(--bg-main)] text-[var(--text-subtle)] rounded-2xl font-bold text-sm ring-1 ring-[var(--border-color)] transition-all flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Annuleren
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-4 bg-[var(--theme-error)]/5 hover:bg-[var(--theme-error)]/10 text-[var(--theme-error)] rounded-2xl ring-1 ring-[var(--theme-error)]/20 transition-all shadow-sm"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
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
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">{label}</label>
            <input 
                {...props} 
                className={`w-full px-4 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)]/50 rounded-xl text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all ${props.className || ''}`}
            />
        </div>
    );
}

function Select({ label, children, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">{label}</label>
            <div className="relative group">
                <select 
                    {...props} 
                    className="w-full pl-4 pr-10 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)]/50 rounded-xl text-sm text-[var(--text-main)] font-semibold focus:ring-2 focus:ring-[var(--theme-purple)] transition-all appearance-none cursor-pointer"
                >
                    {children}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 h-4 w-4 text-[var(--text-light)] pointer-events-none group-hover:text-[var(--theme-purple)] transition-colors" />
            </div>
        </div>
    );
}

function Textarea({ label, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] px-1">{label}</label>
            <textarea 
                {...props} 
                className="w-full px-4 py-3 bg-[var(--bg-main)] border-0 ring-1 ring-[var(--border-color)]/50 rounded-xl text-sm text-[var(--text-main)] focus:ring-2 focus:ring-[var(--theme-purple)] transition-all resize-none min-h-[100px]"
            />
        </div>
    );
}

function Checkbox({ label, ...props }: any) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="h-6 w-11 bg-[var(--border-color)]/50 rounded-full peer-checked:bg-[var(--theme-purple)] transition-all" />
                <div className="absolute left-1 top-1 h-4 w-4 bg-[var(--bg-card)] rounded-full transition-all peer-checked:left-6" />
            </div>
            <span className="text-xs font-bold text-[var(--text-subtle)] group-hover:text-[var(--text-main)] transition-colors uppercase tracking-widest">{label}</span>
        </label>
    );
}
