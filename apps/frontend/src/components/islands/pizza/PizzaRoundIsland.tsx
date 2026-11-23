'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import type { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pizza, Link2, Clock, Pencil, Trash2, Check, Copy, Lock, Banknote, ClipboardList, Receipt, History, Star, ExternalLink, CreditCard } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Checkbox,
    Group,
    NumberInput,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    VisuallyHidden,
} from '@mantine/core';
import {
    placePizzaOrderSchema,
    type PlacePizzaOrderInput,
    type PizzaRoundDetail,
    type PizzaOrderView,
    type PizzaFavorites,
} from '@salvemundi/validations';
import { Tile } from '@/components/islands/account/profile/ProfielUI';
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
    setPizzaPaymentLink,
} from '@/server/actions/public/pizza.actions';
import { formatEuro, STATUS_LABEL } from './pizza-utils';

type ActionResult = { success: boolean; error?: string };

const REFRESH_MS = 10_000;

function getStatusColor(status: string): string {
    switch (status) {
        case 'open':
            return 'success';
        case 'closed':
            return 'accent';
        default:
            return 'brand';
    }
}

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

type FavoriteFill = { itemName: string; size: string | null; note: string | null; price: number };

const EMPTY_FAVORITES: PizzaFavorites = { lastOrder: null, favorites: [] };

export function PizzaRoundIsland({ detail, favorites = EMPTY_FAVORITES }: { detail: PizzaRoundDetail; favorites?: PizzaFavorites }) {
    const { round, orders, isCreator } = detail;
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const { showToast } = useAdminToast();
    const [now, setNow] = useState<number | null>(null);
    const [editing, setEditing] = useState<PizzaOrderView | null>(null);

    const isOpen = round.isOpen;

    const {
        register,
        control,
        handleSubmit,
        reset,
        setValue,
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

    const fillForm = (f: FavoriteFill) => {
        const opts = { shouldDirty: true, shouldValidate: true } as const;
        setValue('item_name', f.itemName, opts);
        setValue('size', f.size ?? '', opts);
        setValue('note', f.note ?? '', opts);
        setValue('price', f.price, opts);
    };

    const [linkDraft, setLinkDraft] = useState(round.paymentLink ?? '');
    const [editingLink, setEditingLink] = useState(false);
    const saveLink = (link: string | null) => {
        run(() => setPizzaPaymentLink(round.id, link), link ? 'Betaallink opgeslagen' : 'Betaallink verwijderd', () => {
            setEditingLink(false);
            if (!link) setLinkDraft('');
        });
    };

    const safeLink = round.paymentLink?.startsWith('https://') ? round.paymentLink : null;
    const myOrders = orders.filter((o) => o.isMine);
    const myTotal = myOrders.reduce((sum, o) => sum + o.price, 0);
    const myUnpaid = myOrders.filter((o) => !o.paidAt).reduce((sum, o) => sum + o.price, 0);
    const showFavorites = !editing && (favorites.lastOrder !== null || favorites.favorites.length > 0);

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
        <Stack gap="xl">
            <Tile
                title={round.title}
                icon={<Pizza size={22} />}
                actions={
                    <Button
                        type="button"
                        onClick={() => void copyText(window.location.href, 'Link gekopieerd')}
                        leftSection={<Link2 size={16} />}
                    >
                        Deellink kopiëren
                    </Button>
                }
            >
                <Stack gap="xs">
                    <Group gap="sm" wrap="wrap">
                        <Badge color={getStatusColor(round.status)}>
                            {STATUS_LABEL[round.status]}
                        </Badge>
                        <Group gap={6}>
                            <Text span c="brand" lh={1}>
                                <Clock size={16} />
                            </Text>
                            <Text size="sm" fw={700}>
                                {isOpen ? countdown(round.closesAt, now) : 'Gesloten'} · {formatDate(round.closesAt, 'd MMMM yyyy HH:mm')}
                            </Text>
                        </Group>
                    </Group>
                    <Text size="sm" c="dimmed">
                        Aangemaakt door {round.creatorName}
                    </Text>
                    {round.note && (
                        <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                            {round.note}
                        </Text>
                    )}
                </Stack>
            </Tile>

            {myOrders.length > 0 && !isCreator && (
                <Tile title="Jouw betaling" icon={<CreditCard size={22} />}>
                    <Stack gap="md">
                        <Text size="sm" fw={700} aria-live="polite">
                            Jouw totaal: {formatEuro(myTotal)}, status:{' '}
                            {myUnpaid === 0 ? 'betaald' : `nog te betalen aan ${round.creatorName}`}
                            {myUnpaid > 0 && myUnpaid !== myTotal ? ` (nog ${formatEuro(myUnpaid)})` : ''}
                        </Text>
                        {safeLink && myUnpaid > 0 && (
                            <Paper
                                p="md"
                                withBorder
                                style={{
                                    backgroundColor: 'var(--surface-subtle)',
                                    borderColor: 'var(--surface-subtle-border)',
                                }}
                            >
                                <Stack gap="sm" align="flex-start">
                                    <Text size="sm" fw={900} c="brand">
                                        Betalen aan {round.creatorName}: {formatEuro(myUnpaid)}
                                    </Text>
                                    <Button
                                        component="a"
                                        href={safeLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        leftSection={<ExternalLink size={16} />}
                                    >
                                        Betalen
                                    </Button>
                                </Stack>
                            </Paper>
                        )}
                    </Stack>
                </Tile>
            )}

            {isCreator && (
                <Tile title="Betaallink" icon={<CreditCard size={22} />}>
                    <Stack gap="sm">
                        {safeLink && !editingLink ? (
                            <Text size="sm" style={{ wordBreak: 'break-all' }}>
                                {safeLink}
                            </Text>
                        ) : (
                            !editingLink && (
                                <Text size="sm" c="dimmed">
                                    Nog geen betaallink ingesteld.
                                </Text>
                            )
                        )}
                        {editingLink ? (
                            <Stack gap="sm">
                                <TextInput
                                    type="url"
                                    label="Betaallink (optioneel, https)"
                                    value={linkDraft}
                                    onChange={(e) => setLinkDraft(e.currentTarget.value)}
                                    placeholder="https://..."
                                    maxLength={500}
                                />
                                <Group gap="sm" wrap="wrap">
                                    <Button
                                        type="button"
                                        loading={isPending}
                                        onClick={() => saveLink(linkDraft.trim() || null)}
                                        leftSection={<Check size={16} />}
                                    >
                                        Opslaan
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setEditingLink(false);
                                            setLinkDraft(round.paymentLink ?? '');
                                        }}
                                    >
                                        Annuleren
                                    </Button>
                                </Group>
                            </Stack>
                        ) : (
                            <Group gap="sm" wrap="wrap">
                                <Button
                                    type="button"
                                    onClick={() => setEditingLink(true)}
                                    leftSection={<Pencil size={16} />}
                                >
                                    {round.paymentLink ? 'Aanpassen' : 'Link toevoegen'}
                                </Button>
                                {round.paymentLink && (
                                    <Button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => saveLink(null)}
                                        leftSection={<Trash2 size={16} />}
                                    >
                                        Verwijderen
                                    </Button>
                                )}
                            </Group>
                        )}
                    </Stack>
                </Tile>
            )}

            {isOpen && (
                <Tile title={editing ? 'Bestelling bewerken' : 'Mijn bestelling'} icon={<Pizza size={22} />}>
                    <Box component="form" onSubmit={(e) => void handleSubmit(onSubmit)(e)} noValidate>
                        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                            {showFavorites && (
                                <Stack gap="xs" style={{ gridColumn: '1 / -1' }}>
                                    {favorites.lastOrder && (
                                        <Box>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => favorites.lastOrder && fillForm(favorites.lastOrder)}
                                                leftSection={<History size={16} />}
                                            >
                                                Zelfde als vorige keer
                                            </Button>
                                        </Box>
                                    )}
                                    {favorites.favorites.length > 0 && (
                                        <Group gap="xs" wrap="wrap" align="center">
                                            <Text span c="brand" lh={1}>
                                                <Star size={16} aria-hidden="true" />
                                            </Text>
                                            {favorites.favorites.map((f) => (
                                                <Button
                                                    key={`${f.itemName}|${f.size ?? ''}|${f.note ?? ''}|${f.price}`}
                                                    type="button"
                                                    size="compact-xs"
                                                    onClick={() => fillForm(f)}
                                                >
                                                    {f.itemName}{f.size ? ` (${f.size})` : ''} · {formatEuro(f.price)}
                                                </Button>
                                            ))}
                                        </Group>
                                    )}
                                </Stack>
                            )}

                            <Box style={{ gridColumn: 'span 2' }} visibleFrom="md">
                                <TextInput
                                    label="Pizza"
                                    required
                                    placeholder="Bijv. Margherita"
                                    maxLength={100}
                                    error={errors.item_name?.message}
                                    {...register('item_name')}
                                />
                            </Box>
                            <Box hiddenFrom="md">
                                <TextInput
                                    label="Pizza"
                                    required
                                    placeholder="Bijv. Margherita"
                                    maxLength={100}
                                    error={errors.item_name?.message}
                                    {...register('item_name')}
                                />
                            </Box>

                            <TextInput
                                label="Maat"
                                placeholder="Bijv. M"
                                maxLength={20}
                                error={errors.size?.message}
                                {...register('size')}
                            />

                            <Controller
                                name="price"
                                control={control}
                                render={({ field }) => (
                                    <NumberInput
                                        label="Prijs (€)"
                                        required
                                        min={0}
                                        max={100}
                                        step={0.5}
                                        decimalScale={2}
                                        placeholder="0,00"
                                        value={typeof field.value === 'string' || typeof field.value === 'number' ? field.value : ''}
                                        onChange={(val) => field.onChange(val === '' ? undefined : val)}
                                        error={errors.price?.message}
                                    />
                                )}
                            />

                            <Box style={{ gridColumn: 'span 2' }} visibleFrom="md">
                                <TextInput
                                    label="Opmerking"
                                    placeholder="Bijv. zonder ui"
                                    maxLength={200}
                                    error={errors.note?.message}
                                    {...register('note')}
                                />
                            </Box>
                            <Box hiddenFrom="md">
                                <TextInput
                                    label="Opmerking"
                                    placeholder="Bijv. zonder ui"
                                    maxLength={200}
                                    error={errors.note?.message}
                                    {...register('note')}
                                />
                            </Box>

                            <Box style={{ gridColumn: '1 / -1' }}>
                                <Controller
                                    name="payConfirmed"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox
                                            label={`Ik betaal ${round.creatorName} mijn deel terug`}
                                            checked={Boolean(field.value)}
                                            onChange={(e) => field.onChange(e.currentTarget.checked)}
                                            error={errors.payConfirmed?.message}
                                        />
                                    )}
                                />
                            </Box>

                            <Group gap="sm" wrap="wrap" style={{ gridColumn: '1 / -1' }}>
                                <Button
                                    type="submit"
                                    loading={isPending}
                                    leftSection={<Check size={16} />}
                                >
                                    {editing ? 'Opslaan' : 'Bestelling plaatsen'}
                                </Button>
                                {editing && (
                                    <Button type="button" onClick={resetForm}>
                                        Annuleren
                                    </Button>
                                )}
                            </Group>
                        </SimpleGrid>
                    </Box>
                </Tile>
            )}

            <Tile title="Bestellingen" icon={<ClipboardList size={22} />}>
                {orders.length === 0 ? (
                    <Paper p="xl" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                        <Text size="sm" fw={700} c="dimmed">
                            Nog geen bestellingen.
                        </Text>
                    </Paper>
                ) : (
                    <ScrollArea>
                        <Table verticalSpacing="sm" horizontalSpacing="md" highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>
                                        <Text size="xs" fw={900} tt="uppercase" c="brand">Naam</Text>
                                    </Table.Th>
                                    <Table.Th>
                                        <Text size="xs" fw={900} tt="uppercase" c="brand">Pizza</Text>
                                    </Table.Th>
                                    <Table.Th ta="right">
                                        <Text size="xs" fw={900} tt="uppercase" c="brand">Prijs</Text>
                                    </Table.Th>
                                    <Table.Th>
                                        <VisuallyHidden>Acties</VisuallyHidden>
                                    </Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {orders.map((o) => (
                                    <Table.Tr key={o.id}>
                                        <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                            <Group gap="xs" wrap="nowrap">
                                                <Text size="sm" fw={700}>
                                                    {o.userName}
                                                </Text>
                                                {o.isMine && (
                                                    <Badge size="xs">
                                                        jij
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap={2}>
                                                <Group gap="xs" wrap="wrap">
                                                    <Text size="sm" fw={900} c="brand">
                                                        {o.itemName}{o.size ? ` (${o.size})` : ''}
                                                    </Text>
                                                    {o.addedToOrderAt && (
                                                        <Badge size="xs" color="success">
                                                            Toegevoegd
                                                        </Badge>
                                                    )}
                                                    <Badge size="xs" color={o.paidAt ? 'brand' : 'accent'}>
                                                        {o.paidAt ? 'Betaald' : 'Nog te betalen'}
                                                    </Badge>
                                                </Group>
                                                {o.note && (
                                                    <Text size="xs" c="dimmed">
                                                        {o.note}
                                                    </Text>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                                            <Text size="sm" fw={900}>
                                                {formatEuro(o.price)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                                            {o.isMine && isOpen && !o.addedToOrderAt && !o.paidAt && (
                                                <Group justify="flex-end" gap="xs" wrap="nowrap">
                                                    <ActionIcon
                                                        type="button"
                                                        onClick={() => startEdit(o)}
                                                        aria-label={`Bewerk bestelling ${o.itemName}`}
                                                    >
                                                        <Pencil size={16} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        type="button"
                                                        color="error"
                                                        disabled={isPending}
                                                        onClick={() => confirmDelete(o)}
                                                        aria-label={`Verwijder bestelling ${o.itemName}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            )}
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                            <Table.Tfoot>
                                <Table.Tr>
                                    <Table.Td colSpan={2}>
                                        <Text size="sm" fw={900}>Totaal</Text>
                                    </Table.Td>
                                    <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                                        <Text size="sm" fw={900} c="brand">{formatEuro(total)}</Text>
                                    </Table.Td>
                                    <Table.Td />
                                </Table.Tr>
                            </Table.Tfoot>
                        </Table>
                    </ScrollArea>
                )}
            </Tile>

            {isCreator && (
                <Tile title="Afrekenen" icon={<Receipt size={22} />}>
                    <Stack gap="lg">
                        <Text size="sm" fw={700} aria-live="polite">
                            {addedCount} van {orders.length} pizza&apos;s toegevoegd
                        </Text>

                        {orders.length > 0 && (
                            <ScrollArea>
                                <Table verticalSpacing="sm" horizontalSpacing="md">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>
                                                <Text size="xs" fw={900} tt="uppercase" c="brand">Bestelling</Text>
                                            </Table.Th>
                                            <Table.Th ta="center">
                                                <Text size="xs" fw={900} tt="uppercase" c="brand">Betaald</Text>
                                            </Table.Th>
                                            <Table.Th ta="center">
                                                <Text size="xs" fw={900} tt="uppercase" c="brand">In bestelling</Text>
                                            </Table.Th>
                                            <Table.Th>
                                                <VisuallyHidden>Acties</VisuallyHidden>
                                            </Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {orders.map((o) => (
                                            <Table.Tr key={o.id}>
                                                <Table.Td>
                                                    <Text size="sm">
                                                        <Text span fw={700}>{o.userName}</Text>
                                                        <Text span c="dimmed"> · {o.itemName}{o.size ? ` (${o.size})` : ''} · {formatEuro(o.price)}</Text>
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group justify="center">
                                                        <Checkbox
                                                            checked={!!o.paidAt}
                                                            disabled={isPending}
                                                            onChange={(e) => run(() => setOrderPaid(o.id, e.currentTarget.checked), 'Betaalstatus bijgewerkt')}
                                                            aria-label={`Betaald: ${o.userName}`}
                                                        />
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group justify="center">
                                                        <Checkbox
                                                            checked={!!o.addedToOrderAt}
                                                            disabled={isPending}
                                                            onChange={(e) => run(() => setOrderAdded(o.id, e.currentTarget.checked), 'Bestelstatus bijgewerkt')}
                                                            aria-label={`In bestelling: ${o.userName}`}
                                                        />
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    {!o.isMine && round.status !== 'paid' && !o.paidAt && (
                                                        <ActionIcon
                                                            type="button"
                                                            color="error"
                                                            disabled={isPending}
                                                            onClick={() => confirmDelete(o)}
                                                            aria-label={`Verwijder bestelling van ${o.userName}`}
                                                        >
                                                            <Trash2 size={16} />
                                                        </ActionIcon>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </ScrollArea>
                        )}

                        <Group gap="sm" wrap="wrap">
                            <Button
                                type="button"
                                onClick={copyOrder}
                                disabled={orders.length === 0}
                                leftSection={<Copy size={16} />}
                            >
                                Bestelling kopiëren
                            </Button>
                            {isOpen && (
                                <Button
                                    type="button"
                                    disabled={isPending}
                                    leftSection={<Lock size={16} />}
                                    onClick={() => {
                                        if (window.confirm('Ronde sluiten? Er kunnen daarna geen bestellingen meer bij.')) {
                                            run(() => closePizzaRound(round.id), 'Ronde gesloten');
                                        }
                                    }}
                                >
                                    Ronde sluiten
                                </Button>
                            )}
                            {!isOpen && round.status !== 'paid' && (
                                <Button
                                    type="button"
                                    disabled={isPending}
                                    leftSection={<Banknote size={16} />}
                                    onClick={() => run(() => markPizzaRoundPaid(round.id), 'Ronde gemarkeerd als volledig betaald')}
                                >
                                    Markeer als volledig betaald
                                </Button>
                            )}
                        </Group>
                    </Stack>
                </Tile>
            )}
        </Stack>
    );
}
