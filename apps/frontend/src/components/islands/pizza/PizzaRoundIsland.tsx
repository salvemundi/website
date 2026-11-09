'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pizza, Link2, Clock, Pencil, Trash2, Check, Copy, Lock, Banknote, ClipboardList, Receipt } from 'lucide-react';
import {
    placePizzaOrderSchema,
    type PlacePizzaOrderInput,
    type PizzaRoundDetail,
    type PizzaOrderView,
} from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
import { FormField } from '@/shared/ui/FormField';
import { Input } from '@/shared/ui/Input';
import BeheerToast from '@/components/ui/beheer/BeheerToast';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { formatDate } from '@/shared/lib/utils/date';
import {
    placePizzaOrder,
    updatePizzaOrder,
    deletePizzaOrder,
    setOrderAdded,
    setOrderPaid,
    closePizzaRound,
    markPizzaRoundPaid,
} from '@/server/actions/public/pizza.actions';
import { badgeBase, formatEuro, STATUS_CLASS, STATUS_LABEL } from './pizza-utils';

type ActionResult = { success: boolean; error?: string };

const REFRESH_MS = 10_000;

function countdown(closesAt: string, now: number | null): string {
    if (now === null) return 'Open';
    const diff = new Date(closesAt).getTime() - now;
    if (diff <= 0) return 'Tijd is om';
    const totalMin = Math.floor(diff / 60_000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0) return `Nog ${h} u ${m} min`;
    if (m > 0) return `Nog ${m} min`;
    return `Nog ${Math.max(1, Math.floor(diff / 1000))} sec`;
}

export function PizzaRoundIsland({ detail }: { detail: PizzaRoundDetail }) {
    const { round, orders, isCreator } = detail;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { toast, showToast, hideToast } = useAdminToast();
    const [now, setNow] = useState<number | null>(null);
    const [editing, setEditing] = useState<PizzaOrderView | null>(null);

    const isOpen = round.isOpen;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<z.input<typeof placePizzaOrderSchema>, unknown, PlacePizzaOrderInput>({
        resolver: zodResolver(placePizzaOrderSchema),
        defaultValues: { item_name: '', size: '', note: '', payConfirmed: undefined },
    });

    useEffect(() => {
        setNow(Date.now());
        if (!isOpen) return;
        const closesAtMs = new Date(round.closesAt).getTime();
        let refreshedAtClose = false;
        const tick = setInterval(() => {
            const t = Date.now();
            setNow(t);
            if (!refreshedAtClose && t >= closesAtMs) {
                refreshedAtClose = true;
                startTransition(() => router.refresh());
            }
        }, 1000);
        const refresh = setInterval(() => {
            if (document.visibilityState === 'visible') startTransition(() => router.refresh());
        }, REFRESH_MS);
        return () => {
            clearInterval(tick);
            clearInterval(refresh);
        };
    }, [isOpen, round.closesAt, router]);

    const total = useMemo(() => orders.reduce((sum, o) => sum + o.price, 0), [orders]);
    const addedCount = orders.filter((o) => o.addedToOrderAt).length;

    const run = (fn: () => Promise<ActionResult>, okMessage: string, after?: () => void) => {
        startTransition(async () => {
            const res = await fn();
            if (res.success) {
                showToast(okMessage, 'success');
                after?.();
                router.refresh();
            } else {
                showToast(res.error || 'Er ging iets mis', 'error');
            }
        });
    };

    const resetForm = () => {
        setEditing(null);
        reset({ item_name: '', size: '', note: '', payConfirmed: undefined });
    };

    const onSubmit = (data: PlacePizzaOrderInput) => {
        if (editing) {
            run(() => updatePizzaOrder(editing.id, data), 'Bestelling bijgewerkt', resetForm);
        } else {
            run(() => placePizzaOrder(round.id, data), 'Bestelling geplaatst', resetForm);
        }
    };

    const startEdit = (o: PizzaOrderView) => {
        setEditing(o);
        reset({ item_name: o.itemName, size: o.size ?? '', note: o.note ?? '', price: o.price, payConfirmed: true });
    };

    const copyText = async (text: string, okMessage: string) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast(okMessage, 'success');
        } catch {
            showToast('Kopiëren is niet gelukt', 'error');
        }
    };

    const copyOrder = () => {
        const counts = new Map<string, number>();
        for (const o of orders) {
            const key = [o.itemName, o.size].filter(Boolean).join(' ');
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const text = [...counts].map(([name, n]) => `${n}× ${name}`).join('\n');
        void copyText(text, 'Bestelling gekopieerd');
    };

    const confirmDelete = (o: PizzaOrderView) => {
        if (!window.confirm(`Bestelling van ${o.userName} (${o.itemName}) verwijderen?`)) return;
        run(() => deletePizzaOrder(o.id), 'Bestelling verwijderd', () => {
            if (editing?.id === o.id) resetForm();
        });
    };

    return (
        <div className="space-y-8">
            <Tile
                title={round.title}
                icon={<Pizza className="size-6" />}
                actions={
                    <button
                        type="button"
                        onClick={() => void copyText(window.location.href, 'Link gekopieerd')}
                        className="form-button"
                    >
                        <Link2 className="size-4" />
                        Deellink kopiëren
                    </button>
                }
            >
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className={`${badgeBase} ${STATUS_CLASS[round.status]}`}>{STATUS_LABEL[round.status]}</span>
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                            <Clock className="size-4 text-purple-500" />
                            {isOpen ? countdown(round.closesAt, now) : `Gesloten`} · {formatDate(round.closesAt, 'd MMMM yyyy HH:mm')}
                        </span>
                    </div>
                    <p className="text-sm text-(--text-muted)">Aangemaakt door {round.creatorName}</p>
                    {round.note && <p className="text-sm whitespace-pre-line">{round.note}</p>}
                </div>
            </Tile>

            {isOpen && (
                <Tile title={editing ? 'Bestelling bewerken' : 'Mijn bestelling'} icon={<Pizza className="size-6" />}>
                    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="grid grid-cols-1 gap-4 md:grid-cols-3" noValidate>
                        <FormField label="Pizza" required error={errors.item_name?.message} className="md:col-span-2">
                            <Input {...register('item_name')} placeholder="Bijv. Margherita" maxLength={100} />
                        </FormField>
                        <FormField label="Maat" error={errors.size?.message}>
                            <Input {...register('size')} placeholder="Bijv. M" maxLength={20} />
                        </FormField>
                        <FormField label="Prijs (€)" required error={errors.price?.message}>
                            <Input type="number" step="0.01" min="0" inputMode="decimal" {...register('price')} placeholder="0,00" />
                        </FormField>
                        <FormField label="Opmerking" error={errors.note?.message} className="md:col-span-2">
                            <Input {...register('note')} placeholder="Bijv. zonder ui" maxLength={200} />
                        </FormField>
                        <div className="space-y-2 md:col-span-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-(--bg-soft) p-3 text-sm font-medium text-(--text-main)">
                                <input
                                    type="checkbox"
                                    {...register('payConfirmed')}
                                    aria-invalid={errors.payConfirmed ? true : undefined}
                                    aria-describedby={errors.payConfirmed ? 'pay-confirmed-error' : undefined}
                                    className="size-4 accent-(--theme-purple)"
                                />
                                Ik betaal {round.creatorName} mijn deel terug
                            </label>
                            {errors.payConfirmed?.message && (
                                <p id="pay-confirmed-error" role="alert" className="text-theme-error text-xs font-bold">{errors.payConfirmed.message}</p>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-3 md:col-span-3">
                            <button type="submit" disabled={isPending} className="form-button">
                                <Check className="size-4" />
                                {editing ? 'Opslaan' : 'Bestelling plaatsen'}
                            </button>
                            {editing && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="form-button bg-(--bg-soft)! text-(--text-main)! shadow-none"
                                >
                                    Annuleren
                                </button>
                            )}
                        </div>
                    </form>
                </Tile>
            )}

            <Tile title="Bestellingen" icon={<ClipboardList className="size-6" />}>
                {orders.length === 0 ? (
                    <div className="squircle-lg border-2 border-dashed border-slate-300 bg-slate-50 p-8 text-center shadow-inner dark:border-white/10 dark:bg-black/10">
                        <p className="text-sm font-bold text-(--text-muted)">Nog geen bestellingen.</p>
                    </div>
                ) : (
                    <div className="-mx-6 overflow-x-auto sm:mx-0">
                        <table className="w-full border-separate border-spacing-0">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-white/5">
                                    <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Naam</th>
                                    <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Pizza</th>
                                    <th className="px-4 py-3 text-right text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Prijs</th>
                                    <th className="px-4 py-3"><span className="sr-only">Acties</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                {orders.map((o) => (
                                    <tr key={o.id} className="transition-all hover:bg-slate-50 dark:hover:bg-white/5">
                                        <td className="p-4 text-sm font-bold whitespace-nowrap text-(--text-main)">
                                            {o.userName}
                                            {o.isMine && <span className="ml-2 text-[10px] font-black text-purple-500 uppercase">jij</span>}
                                        </td>
                                        <td className="p-4 text-sm text-(--text-main)">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-black text-purple-700 dark:text-white">
                                                    {o.itemName}{o.size ? ` (${o.size})` : ''}
                                                </span>
                                                {o.addedToOrderAt && (
                                                    <span className={`${badgeBase} ${STATUS_CLASS.open}`}>Toegevoegd</span>
                                                )}
                                            </div>
                                            {o.note && <p className="mt-0.5 text-xs text-(--text-muted)">{o.note}</p>}
                                        </td>
                                        <td className="p-4 text-right text-sm font-black whitespace-nowrap text-(--text-main)">
                                            {formatEuro(o.price)}
                                        </td>
                                        <td className="p-4 text-right whitespace-nowrap">
                                            {o.isMine && isOpen && !o.addedToOrderAt && !o.paidAt && (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(o)}
                                                        aria-label={`Bewerk bestelling ${o.itemName}`}
                                                        className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-purple)"
                                                    >
                                                        <Pencil className="size-4" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isPending}
                                                        onClick={() => confirmDelete(o)}
                                                        aria-label={`Verwijder bestelling ${o.itemName}`}
                                                        className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-error)"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-slate-200 dark:border-white/5">
                                    <td colSpan={2} className="p-4 text-sm font-black text-(--text-main)">Totaal</td>
                                    <td className="p-4 text-right text-sm font-black whitespace-nowrap text-purple-700 dark:text-white">{formatEuro(total)}</td>
                                    <td />
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </Tile>

            {isCreator && (
                <Tile title="Afrekenen" icon={<Receipt className="size-6" />}>
                    <div className="space-y-6">
                        <p className="text-sm font-bold text-(--text-main)" aria-live="polite">
                            {addedCount} van {orders.length} pizza&apos;s toegevoegd
                        </p>

                        {orders.length > 0 && (
                            <div className="-mx-6 overflow-x-auto sm:mx-0">
                                <table className="w-full border-separate border-spacing-0">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-white/5">
                                            <th className="px-4 py-3 text-left text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Bestelling</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">Betaald</th>
                                            <th className="px-4 py-3 text-center text-[10px] font-black tracking-widest text-purple-500 uppercase opacity-60">In bestelling</th>
                                            <th className="px-4 py-3"><span className="sr-only">Acties</span></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                                        {orders.map((o) => (
                                            <tr key={o.id}>
                                                <td className="px-4 py-3 text-sm text-(--text-main)">
                                                    <span className="font-bold">{o.userName}</span>
                                                    <span className="text-(--text-muted)"> · {o.itemName}{o.size ? ` (${o.size})` : ''} · {formatEuro(o.price)}</span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!o.paidAt}
                                                        disabled={isPending}
                                                        onChange={(e) => run(() => setOrderPaid(o.id, e.target.checked), 'Betaalstatus bijgewerkt')}
                                                        aria-label={`Betaald: ${o.userName}`}
                                                        className="size-5 cursor-pointer accent-(--theme-purple)"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={!!o.addedToOrderAt}
                                                        disabled={isPending}
                                                        onChange={(e) => run(() => setOrderAdded(o.id, e.target.checked), 'Bestelstatus bijgewerkt')}
                                                        aria-label={`In bestelling: ${o.userName}`}
                                                        className="size-5 cursor-pointer accent-(--theme-purple)"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {!o.isMine && round.status !== 'paid' && !o.paidAt && (
                                                        <button
                                                            type="button"
                                                            disabled={isPending}
                                                            onClick={() => confirmDelete(o)}
                                                            aria-label={`Verwijder bestelling van ${o.userName}`}
                                                            className="icon-button rounded-lg bg-(--bg-soft) p-2 text-(--text-muted) hover:text-(--theme-error)"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <button type="button" onClick={copyOrder} disabled={orders.length === 0} className="form-button">
                                <Copy className="size-4" />
                                Bestelling kopiëren
                            </button>
                            {isOpen && (
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => {
                                        if (window.confirm('Ronde sluiten? Er kunnen daarna geen bestellingen meer bij.')) {
                                            run(() => closePizzaRound(round.id), 'Ronde gesloten');
                                        }
                                    }}
                                    className="form-button"
                                >
                                    <Lock className="size-4" />
                                    Ronde sluiten
                                </button>
                            )}
                            {!isOpen && round.status !== 'paid' && (
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => run(() => markPizzaRoundPaid(round.id), 'Ronde gemarkeerd als volledig betaald')}
                                    className="form-button"
                                >
                                    <Banknote className="size-4" />
                                    Markeer als volledig betaald
                                </button>
                            )}
                        </div>
                    </div>
                </Tile>
            )}
            <BeheerToast toast={toast} onClose={hideToast} />
        </div>
    );
}
