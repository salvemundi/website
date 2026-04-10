'use client';

import React, { useTransition, useEffect, useRef } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { initiateKroegentochtPayment } from '@/server/actions/kroegentocht.actions';
import { 
    type PubCrawlEvent, 
    pubCrawlSignupFormSchema, 
    type PubCrawlSignupForm,
    type PubCrawlParticipant 
} from '@salvemundi/validations';
import { Plus, Minus, Mail, Building, Ticket, AlertCircle } from 'lucide-react';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';

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
    initialUser?: any;
}

// Type removed since it's now defined in @salvemundi/validations as PubCrawlSignupForm

export default function KroegentochtFormIsland({ 
    isLoading = false, 
    event = {} as PubCrawlEvent, 
    initialUser 
}: KroegentochtFormIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const errorRef = useRef<HTMLDivElement>(null);

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm<PubCrawlSignupForm>({
        resolver: zodResolver(pubCrawlSignupFormSchema),
        defaultValues: {
            email: initialUser?.email || '',
            association: (initialUser as any)?.association || '',
            customAssociation: '',
            amount_tickets: 1,
            participants: [{ 
                name: '', 
                initial: '' 
            }],
            website: '',
            pub_crawl_event_id: event.id,
        }
    });

    // REIS_FORM_V7.6_SSR: Skeletons en useEffect prefills verwijderd voor maximale stabiliteit.


    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const amount = watch('amount_tickets');
    const association = watch('association');

    useEffect(() => {
        const currentLength = fields.length;
        if (amount > currentLength) {
            for (let i = 0; i < amount - currentLength; i++) {
                append({ name: '', initial: '' });
            }
        } else if (amount < currentLength) {
            for (let i = 0; i < currentLength - amount; i++) {
                remove(fields.length - 1 - i);
            }
        }
    }, [amount, append, remove, fields.length]);

    const onSubmit = async (data: PubCrawlSignupForm) => {
        if (data.website) return;

        startTransition(async () => {
            const finalAssociation = data.association === 'Anders' ? data.customAssociation : data.association;
            const participants = data.participants;
            
            const formData = {
                ...data,
                name: `${participants[0].name} ${participants[0].initial}`.trim(),
                association: finalAssociation || '',
                name_initials: JSON.stringify(participants),
                pub_crawl_event_id: Number(event.id),
            };

            const result = await initiateKroegentochtPayment(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de betaling.', 'error');
            }
        });
    };

    // Skeletons verwijderd om browser autofill niet te blokkeren.


    return (
        <section className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xl p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl font-black text-[var(--theme-purple)] mb-4 flex items-center gap-3">
                <Ticket className="w-8 h-8" />
                Inschrijven
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Vul hieronder je gegevens in en reserveer je plek voor de kroegentocht. 
                Tickets kosten slechts <strong>€1,00</strong> per stuk!
            </p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                <FormField id="field-email" label="E-mailadres" required error={errors.email?.message}>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            {...register('email')}
                            id="field-email"
                            type="email"
                            placeholder="jouw@email.nl"
                            className="pl-10"
                        />
                    </div>
                </FormField>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField id="field-association" label="Vereniging" required error={errors.association?.message}>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                {...register('association')}
                                id="field-association"
                                className="form-input pl-10"
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
                        <FormField id="field-customAssociation" label="Naam vereniging" required error={errors.customAssociation?.message}>
                            <Input
                                {...register('customAssociation')}
                                id="field-customAssociation"
                                placeholder="Naam van je vereniging"
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
                                onClick={() => setValue('amount_tickets', Math.max(1, amount - 1))}
                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                                disabled={amount <= 1}
                            >
                                <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-black text-lg">{amount}</span>
                            <button
                                type="button"
                                onClick={() => setValue('amount_tickets', Math.min(10, amount + 1))}
                                className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
                                disabled={amount >= 10}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {fields.map((field, index) => (
                            <div key={field.id} className="bg-white dark:bg-white/5 rounded-xl p-4 border border-slate-100 dark:border-white/10 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-6 h-6 rounded-full bg-[var(--theme-purple)] text-white flex items-center justify-center text-[10px] font-bold">
                                        {index + 1}
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deelnemer {index + 1}</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex-grow">
                                        <label htmlFor={`field-participants-${index}-name`} className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Voornaam + tussenvoegsel</label>
                                        <Input
                                            {...register(`participants.${index}.name`)}
                                            id={`field-participants-${index}-name`}
                                            placeholder="Bijv. Jan van"
                                            required
                                        />
                                    </div>
                                    <div className="w-24">
                                        <label htmlFor={`field-participants-${index}-initial`} className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">1e letter achtern.</label>
                                        <Input
                                            {...register(`participants.${index}.initial`, {
                                                onChange: (e) => {
                                                    setValue(`participants.${index}.initial`, e.target.value.slice(0, 1).toUpperCase());
                                                }
                                            })}
                                            id={`field-participants-${index}-initial`}
                                            placeholder="Bijv. S"
                                            maxLength={1}
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
                    className="w-full bg-[var(--theme-purple)] hover:bg-[var(--color-purple-600)] text-white font-black py-4 rounded-xl sm:rounded-2xl transition-all shadow-lg shadow-purple-500/20 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
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

                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <div className="opacity-0 absolute top-0 left-0 h-0 w-0 -z-10 pointer-events-none overflow-hidden" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input {...register('website')} id="website" tabIndex={-1} autoComplete="off" suppressHydrationWarning />
                </div>
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </section>
    );
}

