'use client';

import React, { useState, useTransition, useEffect, useRef } from 'react';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { initiateKroegentochtPayment } from '@/server/actions/kroegentocht.actions';
import { type PubCrawlEvent, type PubCrawlParticipant } from '@salvemundi/validations';
import { Plus, Minus, User, Mail, Building, Ticket, AlertCircle } from 'lucide-react';

const ASSOCIATIONS = [
    'Salve Mundi',
    'Proxy',
    'Prick',
    'Young Financials',
    'Glow',
    'Socialis',
    'Topsy',
    'Watoto',
    'Bge',
    'Fact',
    'Fpsa',
    'Averroes',
    'Paramedisch',
    'Planck',
    'Pac',
    'Anders'
];

interface KroegentochtFormIslandProps {
    isLoading?: boolean;
    event?: PubCrawlEvent;
}

export default function KroegentochtFormIsland({ isLoading = false, event = {} as PubCrawlEvent }: KroegentochtFormIslandProps) {
    const [isPending, startTransition] = useTransition();
    const [amount, setAmount] = useState(1);
    const [participants, setParticipants] = useState<PubCrawlParticipant[]>([{ name: '', initial: '' }]);
    const [email, setEmail] = useState('');
    const [association, setAssociation] = useState('');
    const [customAssociation, setCustomAssociation] = useState('');
    const [website, setWebsite] = useState(''); // Honeypot
    const [error, setError] = useState<string | null>(null);
    const errorRef = useRef<HTMLDivElement>(null);

    // Sync participants array size with amount
    useEffect(() => {
        if (participants.length < amount) {
            const extra = Array(amount - participants.length).fill(null).map(() => ({ name: '', initial: '' }));
            setParticipants([...participants, ...extra]);
        } else if (participants.length > amount) {
            setParticipants(participants.slice(0, amount));
        }
    }, [amount]);

    useEffect(() => {
        if (error && errorRef.current) {
            errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [error]);

    const handleParticipantChange = (index: number, field: keyof PubCrawlParticipant, value: string) => {
        const newParticipants = [...participants];
        if (field === 'initial') {
            newParticipants[index] = { ...newParticipants[index], [field]: value.slice(0, 1).toUpperCase() };
        } else {
            newParticipants[index] = { ...newParticipants[index], [field]: value };
        }
        setParticipants(newParticipants);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Honeypot check
        if (website) {
            return;
        }

        startTransition(async () => {
            const finalAssociation = association === 'Anders' ? customAssociation : association;
            
            const formData = {
                name: `${participants[0].name} ${participants[0].initial}`,
                email,
                association: finalAssociation,
                amount_tickets: amount,
                pub_crawl_event_id: event.id,
                name_initials: JSON.stringify(participants),
            };

            const result = await initiateKroegentochtPayment(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                setError(result.error || 'Er is een fout opgetreden bij het aanmaken van de betaling.');
            }
        });
    };

    if (isLoading) {
        return (
            <section className="w-full bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 md:p-8" aria-busy="true">
                <Skeleton className="h-8 w-72 mb-8" rounded="lg" />
                
                <div className="space-y-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" rounded="md" />
                            <Skeleton className="h-12 w-full" rounded="xl" />
                        </div>
                    ))}
                    <Skeleton className="h-32 w-full" rounded="2xl" />
                    <Skeleton className="h-14 w-full" rounded="xl" />
                </div>
            </section>
        );
    }

    return (
        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--color-purple-theme)] mb-4 flex items-center gap-3">
                <Ticket className="w-8 h-8" />
                Inschrijven
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Vul hieronder je gegevens in en reserveer je plek voor de kroegentocht. 
                Tickets kosten slechts <strong>€1,00</strong> per stuk!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div ref={errorRef} className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                {/* Honeypot */}
                <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                        type="text"
                        id="website"
                        name="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        tabIndex={-1}
                        autoComplete="off"
                        suppressHydrationWarning
                    />

                </div>

                <FormField label="E-mailadres" required>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jouw@email.nl"
                            className="pl-10"
                            required
                        />
                    </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label="Vereniging" required>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                name="association"
                                value={association}
                                onChange={(e) => setAssociation(e.target.value)}
                                className="form-input pl-10"
                                required
                                suppressHydrationWarning
                            >

                                <option value="" className="text-slate-500">Selecteer vereniging</option>
                                {ASSOCIATIONS.map(a => (
                                    <option key={a} value={a} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                                        {a}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </FormField>

                    {association === 'Anders' && (
                        <FormField label="Naam vereniging" required>
                            <Input
                                name="customAssociation"
                                value={customAssociation}
                                onChange={(e) => setCustomAssociation(e.target.value)}
                                placeholder="Naam van je vereniging"
                                required
                            />
                        </FormField>
                    )}
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-6 mt-8">
                    <div className="flex items-center justify-between mb-6">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Aantal Personen
                        </label>
                        <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-100 dark:border-white/10">
                            <button
                                type="button"
                                onClick={() => setAmount(Math.max(1, amount - 1))}
                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                                disabled={amount <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-black text-lg">{amount}</span>
                            <button
                                type="button"
                                onClick={() => setAmount(Math.min(10, amount + 1))}
                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                                disabled={amount >= 10}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {participants.map((p, i) => (
                            <div key={i} className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10 shadow-sm animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-[var(--color-purple-theme)] text-white flex items-center justify-center text-[10px] font-bold">
                                        {i + 1}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deelnemer {i + 1}</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-grow">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Voornaam + tussenvoegsel</label>
                                        <Input
                                            placeholder="Bijv. Jan van"
                                            value={p.name}
                                            onChange={(e) => handleParticipantChange(i, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">1e letter achtern.</label>
                                        <Input
                                            placeholder="Bijv. S"
                                            maxLength={1}
                                            value={p.initial}
                                            onChange={(e) => handleParticipantChange(i, 'initial', e.target.value)}
                                            className="text-center uppercase font-bold"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full bg-[var(--color-purple-theme)] hover:bg-[var(--color-purple-600)] text-white font-black py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
                >
                    {isPending ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Verwerken...
                        </>
                    ) : (
                        `Betalen & Inschrijven (€${(amount * 1.00).toFixed(2).replace('.', ',')})`
                    )}
                </button>
            </form>
        </section>
    );
}
