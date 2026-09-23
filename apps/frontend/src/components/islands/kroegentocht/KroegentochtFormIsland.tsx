'use client';

import React, { useTransition } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import { initiateKroegentochtPayment } from '@/server/actions/events/kroegentocht/kroegentocht-public.actions';
import {
    type PubCrawlEvent,
    pubCrawlSignupFormSchema,
    type PubCrawlSignupForm
} from '@salvemundi/validations/schema/pub-crawl.zod';
import { Plus, Minus, Mail, Building, Ticket } from 'lucide-react';
import { useAdminToast } from '@/hooks/use-admin-toast';
import AdminToast from '@/components/ui/admin/AdminToast';
import { StandardFormCard } from '@/components/ui/forms/StandardFormCard';

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
    event?: PubCrawlEvent;
    initialUser?: { email?: string; association?: string } | null;
}

export default function KroegentochtFormIsland({
    event = {} as PubCrawlEvent,
    initialUser
}: KroegentochtFormIslandProps) {
    const { toast, showToast, hideToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();

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
            association: initialUser?.association || '',
            customAssociation: '',
            amount_tickets: 1,
            participants: [{
                name: '',
                initial: ''
            }],
            website: '',
            pub_crawl_event_id: event.id
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'participants'
    });

    const amount = watch('amount_tickets');
    const association = watch('association');



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
                pub_crawl_event_id: Number(event.id)
            };

            const result = await initiateKroegentochtPayment(formData);

            if (result.success && result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                showToast(result.error || 'Er ging iets mis bij het starten van de betaling.', 'error');
            }
        });
    };

    return (
        <StandardFormCard
            title="Inschrijven"
            icon={<Ticket className="size-8" />}
            description="Vul hieronder je gegevens in en reserveer je plek voor de kroegentocht. Tickets kosten slechts €1,00 per stuk!"
        >
            <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-6" autoComplete="off">
                <FormField id="field-email" label="E-mailadres" required error={errors.email?.message}>
                    <div className="relative">
                        <Mail className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            {...register('email')}
                            id="field-email"
                            type="email"
                            placeholder="jouw@email.nl"
                            className="pl-10"
                        />
                    </div>
                </FormField>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField id="field-association" label="Vereniging" required error={errors.association?.message}>
                        <div className="relative">
                            <Building className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                            <select
                                {...register('association')}
                                id="field-association"
                                className="form-input pl-10"
                                suppressHydrationWarning
                            >
                                <option value="">Selecteer vereniging</option>
                                {ASSOCIATIONS.map(a => (
                                    <option key={a} value={a}>
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

                <div className="mt-8 border-t border-slate-100 pt-6 dark:border-white/5">
                    <div className="mb-6 flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                            Aantal Personen
                        </label>
                        <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-1 dark:border-white/10 dark:bg-white/5">
                            <button
                                type="button"
                                onClick={() => {
                                    if (amount > 1) {
                                        setValue('amount_tickets', amount - 1);
                                        remove(fields.length - 1);
                                    }
                                }}
                                className="icon-button rounded-lg p-2 transition-colors hover:bg-white disabled:opacity-30 dark:hover:bg-white/10"
                                disabled={amount <= 1}
                            >
                                <Minus className="size-4" />
                            </button>
                            <span className="w-8 text-center text-lg font-black">{amount}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (amount < 10) {
                                        setValue('amount_tickets', amount + 1);
                                        append({ name: '', initial: '' });
                                    }
                                }}
                                className="icon-button rounded-lg p-2 transition-colors hover:bg-white disabled:opacity-30 dark:hover:bg-white/10"
                                disabled={amount >= 10}
                            >
                                <Plus className="size-4" />
                            </button>
                        </div>
                    </div>

                    <div className="custom-scrollbar max-h-100 space-y-4 overflow-y-auto pr-2">
                        {fields.map((field, index) => (
                            <div key={field.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5">
                                <div className="mb-3 flex items-center gap-2">
                                    <div className="flex size-6 items-center justify-center rounded-full bg-theme-purple text-[10px] font-bold text-white">
                                        {index + 1}
                                    </div>
                                    <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Deelnemer {index + 1}</span>
                                </div>
                                <div className="flex gap-3">
                                    <div className="grow">
                                        <label htmlFor={`field-participants-${index}-name`} className="mb-1 block text-[10px] font-bold text-slate-400 uppercase">Voornaam + tussenvoegsel</label>
                                        <Input
                                            {...register(`participants.${index}.name`)}
                                            id={`field-participants-${index}-name`}
                                            placeholder="Bijv. Jan van"
                                            required
                                        />
                                    </div>
                                    <div className="w-fit shrink-0">
                                        <label htmlFor={`field-participants-${index}-initial`} className="mb-1 block text-[10px] font-bold whitespace-nowrap text-slate-400 uppercase">1e letter achtern.</label>
                                        <Input
                                            {...register(`participants.${index}.initial`, {
                                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                                                    setValue(`participants.${index}.initial`, e.target.value.slice(0, 1).toUpperCase());
                                                }
                                            })}
                                            id={`field-participants-${index}-initial`}
                                            placeholder="Bijv. S"
                                            maxLength={1}
                                            className="w-20 text-center font-bold uppercase"
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
                    className="enabled:active:scale-0.98 form-button flex w-full items-center justify-center gap-2 rounded-xl bg-theme-purple py-4 text-lg font-black text-white shadow-lg shadow-purple-500/20 transition-all enabled:hover:bg-purple-600 disabled:opacity-50 sm:rounded-2xl"
                >
                    {isPending ? (
                        <>
                            <div className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            Verwerken...
                        </>
                    ) : (
                        `Betalen & Inschrijven (€${(amount * 1.00).toFixed(2).replace('.', ',')})`
                    )}
                </button>

                {/* Honeypot at bottom to avoid breaking browser autofill sections */}
                <div className="pointer-events-none absolute top-0 left-0 -z-10 size-0 overflow-hidden opacity-0" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input {...register('website')} id="website" tabIndex={-1} autoComplete="off" className="hidden" suppressHydrationWarning />
                </div>
            </form>
            <AdminToast toast={toast} onClose={hideToast} />
        </StandardFormCard>
    );
}
