'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pizza, Plus, Clock, Users, ChevronRight, BarChart3 } from 'lucide-react';
import { createPizzaRoundSchema, type CreatePizzaRoundInput, type PizzaRoundSummary } from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import { createPizzaRound } from '@/server/actions/public/pizza.actions';
import { badgeBase, formatEuro, STATUS_CLASS, STATUS_LABEL } from './pizza-utils';

interface Props {
    open: PizzaRoundSummary[];
    mine: PizzaRoundSummary[];
}

function RoundList({ rounds, empty }: { rounds: PizzaRoundSummary[]; empty: string }) {
    if (rounds.length === 0) {
        return (
            <div className="squircle-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-inner dark:border-white/10 dark:bg-black/10">
                <p className="text-sm font-bold text-(--text-muted)">{empty}</p>
            </div>
        );
    }
    return (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {rounds.map((r) => (
                <li key={r.id}>
                    <Link
                        href={`/pizza/${r.id}`}
                        className="group squircle flex w-full items-center gap-4 border border-licht-paars/20 bg-licht-paars/10 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-lg focus:ring-2 focus:ring-purple-300 focus:outline-none dark:border-white/10 dark:bg-white/5"
                    >
                        <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-sm font-black text-purple-700 dark:text-white">{r.title}</span>
                                <span className={`${badgeBase} ${STATUS_CLASS[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                            </div>
                            <p className="text-xs text-(--text-muted)">Door {r.creatorName}</p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-(--text-main)">
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-3.5 text-purple-500" />
                                    {formatDate(r.closesAt, 'd MMMM yyyy HH:mm')}
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <Users className="size-3.5 text-purple-500" />
                                    {r.orderCount} {r.orderCount === 1 ? 'bestelling' : 'bestellingen'} · {formatEuro(r.totalAmount)}
                                </span>
                            </div>
                        </div>
                        <ChevronRight className="size-4 shrink-0 text-purple-700 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 dark:text-purple-300" />
                    </Link>
                </li>
            ))}
        </ul>
    );
}

export function PizzaOverviewIsland({ open, mine }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.input<typeof createPizzaRoundSchema>, unknown, CreatePizzaRoundInput>({
        resolver: zodResolver(createPizzaRoundSchema),
        defaultValues: { title: '', note: '', paymentLink: '' },
    });

    const onSubmit = (data: CreatePizzaRoundInput) => {
        startTransition(async () => {
            const result = await createPizzaRound(data);
            if (result.success) {
                reset();
                showToast('Pizza-ronde aangemaakt', 'success');
                router.push(`/pizza/${result.id}`);
            } else {
                showToast(result.error || 'Er ging iets mis bij het aanmaken van de ronde', 'error');
            }
        });
    };

    return (
        <div className="space-y-8">
            <Link
                href="/pizza/statistieken"
                className="form-button inline-flex"
            >
                <BarChart3 className="size-4" />
                Mijn statistieken
            </Link>

            <Tile title="Open rondes" icon={<Pizza className="size-6" />}>
                <RoundList rounds={open} empty="Er zijn nu geen open pizza-rondes." />
            </Tile>

            <Tile title="Mijn rondes" icon={<Users className="size-6" />}>
                <RoundList rounds={mine} empty="Je hebt nog geen rondes gestart of meebesteld." />
            </Tile>

            <Tile title="Nieuwe ronde" icon={<Plus className="size-6" />}>
                <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="grid grid-cols-1 gap-4 md:grid-cols-2" noValidate>
                    <FormField label="Titel" required error={errors.title?.message}>
                        <Input {...register('title')} placeholder="Bijv. Pizza na de borrel" maxLength={100} />
                    </FormField>
                    <FormField label="Sluitingstijd" required error={errors.closes_at?.message}>
                        <Input type="datetime-local" {...register('closes_at')} />
                    </FormField>
                    <FormField label="Opmerking" error={errors.note?.message} className="md:col-span-2">
                        <textarea
                            {...register('note')}
                            rows={3}
                            maxLength={500}
                            placeholder="Bijv. bestellen bij Domino's, ophalen om 19:00"
                            className="form-input"
                        />
                    </FormField>
                    <FormField label="Betaallink (optioneel, https)" error={errors.paymentLink?.message} className="md:col-span-2">
                        <Input type="url" {...register('paymentLink')} placeholder="https://..." maxLength={500} />
                    </FormField>
                    <div className="md:col-span-2">
                        <button type="submit" disabled={isPending} className="form-button w-full sm:w-auto">
                            <Plus className="size-4" />
                            {isPending ? 'Aanmaken...' : 'Ronde starten'}
                        </button>
                    </div>
                </form>
            </Tile>
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
