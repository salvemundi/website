'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { ClipboardCheck, CheckCircle2, ChevronLeft, Package, Search } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Center,
    Checkbox,
    Container,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toggleOrderPickedUp } from '@/server/actions/beheer/webshop/beheer-webshop-preorders.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { formatCustomFieldValues, type AdminPickupOrder, type AdminPreorderLine } from './webshop-admin-types';

interface Props {
    initialPreorders: AdminPickupOrder[];
}

interface PickupRow {
    order: AdminPickupOrder;
    line: AdminPreorderLine;
}

interface VariantTally {
    label: string;
    total: number;
    pickedUp: number;
}

interface ProductGroup {
    key: string;
    name: string;
    rows: PickupRow[];
    total: number;
    pickedUp: number;
    variants: VariantTally[];
}

const NO_VARIANT = 'Geen maat';

const lineKey = (line: AdminPreorderLine) =>
    line.product_id !== null && line.product_id !== undefined
        ? `id:${line.product_id}`
        : `name:${line.product_name_snapshot ?? ''}`;

// Splits orders per item (an order with several lines shows up under each of its items), and
// tallies units per size/variant so the board can see at a glance what still has to be handed out.
function groupByProduct(preorders: AdminPickupOrder[]): ProductGroup[] {
    const groups = new Map<string, ProductGroup>();

    for (const order of preorders) {
        for (const line of order.lines) {
            const key = lineKey(line);
            const group = groups.get(key) ?? {
                key,
                name: line.product_name_snapshot || 'Onbekend product',
                rows: [],
                total: 0,
                pickedUp: 0,
                variants: [],
            };
            group.rows.push({ order, line });
            group.total += line.quantity;
            if (order.picked_up) group.pickedUp += line.quantity;

            const label = line.variant_label_snapshot || NO_VARIANT;
            let tally = group.variants.find((v) => v.label === label);
            if (!tally) {
                tally = { label, total: 0, pickedUp: 0 };
                group.variants.push(tally);
            }
            tally.total += line.quantity;
            if (order.picked_up) tally.pickedUp += line.quantity;

            groups.set(key, group);
        }
    }

    for (const group of groups.values()) {
        group.variants.sort((a, b) => a.label.localeCompare(b.label, 'nl', { numeric: true }));
        // Sort by size first so the handout can be done pile by pile, then by name.
        group.rows.sort(
            (a, b) =>
                (a.line.variant_label_snapshot ?? '').localeCompare(b.line.variant_label_snapshot ?? '', 'nl', {
                    numeric: true,
                }) ||
                `${a.order.first_name} ${a.order.last_name}`.localeCompare(
                    `${b.order.first_name} ${b.order.last_name}`,
                    'nl'
                )
        );
    }

    return [...groups.values()].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
}

export default function AdminWebshopPickupIsland({ initialPreorders }: Props) {
    const { showToast } = useAdminToast();
    const [preorders, setPreorders] = useState(initialPreorders);
    const [isPending, startTransition] = useTransition();
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [productFilter, setProductFilter] = useState<string | null>(null);
    const [variantFilter, setVariantFilter] = useState<string | null>(null);
    const [hidePickedUp, setHidePickedUp] = useState(false);
    const [search, setSearch] = useState('');

    const handleToggle = (id: number, pickedUp: boolean) => {
        setUpdatingId(id);
        startTransition(async () => {
            const res = await toggleOrderPickedUp(id, pickedUp);
            if (res.success) {
                setPreorders((prev) =>
                    prev.map((p) =>
                        p.id === id
                            ? {
                                  ...p,
                                  picked_up: pickedUp,
                                  picked_up_at: pickedUp ? new Date().toISOString() : null,
                              }
                            : p
                    )
                );
                showToast(pickedUp ? 'Gemarkeerd als opgehaald' : 'Markering ongedaan gemaakt', 'success');
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setUpdatingId(null);
        });
    };

    const groups = useMemo(() => groupByProduct(preorders), [preorders]);
    const openCount = preorders.filter((p) => !p.picked_up).length;

    const visibleGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        return groups
            .filter((g) => !productFilter || g.key === productFilter)
            .map((g) => ({
                ...g,
                rows: g.rows.filter(
                    ({ order, line }) =>
                        (!hidePickedUp || !order.picked_up) &&
                        (!variantFilter || (line.variant_label_snapshot || NO_VARIANT) === variantFilter) &&
                        (!query ||
                            `${order.first_name} ${order.last_name} ${order.email}`.toLowerCase().includes(query))
                ),
            }))
            .filter((g) => g.rows.length > 0);
    }, [groups, productFilter, variantFilter, hidePickedUp, search]);

    const selectProduct = (key: string | null) => {
        setProductFilter((prev) => (prev === key ? null : key));
        setVariantFilter(null);
    };

    const selectVariant = (groupKey: string, label: string) => {
        if (productFilter === groupKey && variantFilter === label) {
            setVariantFilter(null);
            return;
        }
        setProductFilter(groupKey);
        setVariantFilter(label);
    };

    return (
        <>
            <Paper radius={0} shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group gap="md">
                        <Button
                            component={Link}
                            href="/beheer/webshop"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h3" c="brand">
                            Afhaallijst
                        </Title>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="lg">
                <Stack gap="lg">
                    <Text size="sm" c="dimmed">
                        {openCount} van de {preorders.length} bestellingen nog niet opgehaald.
                    </Text>

                    {groups.length > 0 && (
                        <SimpleGrid cols={{ base: 1, sm: 2, xl: 3 }} spacing="md">
                            {groups.map((group) => {
                                const isActive = productFilter === group.key;
                                return (
                                    <Card
                                        key={group.key}
                                        shadow="sm"
                                        withBorder
                                        style={isActive ? { borderColor: 'var(--mantine-color-brand-filled)' } : undefined}
                                    >
                                        <UnstyledButton onClick={() => selectProduct(group.key)} w="100%">
                                            <Group justify="space-between" align="flex-start" wrap="nowrap">
                                                <Group gap="xs" wrap="nowrap">
                                                    <Text span c="brand" lh={1}>
                                                        <Package size={16} />
                                                    </Text>
                                                    <Text size="sm" fw={600}>
                                                        {group.name}
                                                    </Text>
                                                </Group>
                                                <Box ta="right">
                                                    <Text size="lg" fw={700} lh={1}>
                                                        {group.total - group.pickedUp}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        nog uit te geven
                                                    </Text>
                                                </Box>
                                            </Group>
                                        </UnstyledButton>
                                        <Text size="xs" c="dimmed" mt="xs">
                                            {group.total} stuks totaal · {group.pickedUp} opgehaald
                                        </Text>
                                        <Group gap={6} mt="sm">
                                            {group.variants.map((v) => {
                                                const isVariantActive = isActive && variantFilter === v.label;
                                                const done = v.pickedUp >= v.total;
                                                return (
                                                    <Button
                                                        key={v.label}
                                                        size="compact-xs"
                                                        variant={isVariantActive ? 'filled' : 'light'}
                                                        color={isVariantActive ? 'brand' : done ? 'success' : 'gray'}
                                                        onClick={() => selectVariant(group.key, v.label)}
                                                        title={`${v.pickedUp} van ${v.total} opgehaald`}
                                                    >
                                                        {v.label}: {v.total - v.pickedUp}/{v.total}
                                                    </Button>
                                                );
                                            })}
                                        </Group>
                                    </Card>
                                );
                            })}
                        </SimpleGrid>
                    )}

                    {preorders.length > 0 && (
                        <Group justify="space-between" gap="sm">
                            <TextInput
                                type="search"
                                value={search}
                                onChange={(e) => setSearch(e.currentTarget.value)}
                                placeholder="Zoek op naam of e-mail"
                                leftSection={<Search size={14} />}
                                w={{ base: '100%', sm: 320 }}
                            />
                            <Group gap="md">
                                {(productFilter || variantFilter) && (
                                    <Button size="xs" variant="subtle" onClick={() => selectProduct(null)}>
                                        Filter wissen
                                    </Button>
                                )}
                                <Checkbox
                                    size="xs"
                                    label="Verberg opgehaalde bestellingen"
                                    checked={hidePickedUp}
                                    onChange={(e) => setHidePickedUp(e.currentTarget.checked)}
                                />
                            </Group>
                        </Group>
                    )}

                    {preorders.length === 0 ? (
                        <Card p={0} shadow="md">
                            <Center py={80}>
                                <Stack align="center" gap="xs">
                                    <Text span c="dimmed" lh={1}>
                                        <ClipboardCheck size={40} />
                                    </Text>
                                    <Text size="sm" fw={600} c="dimmed">
                                        Nog geen betaalde bestellingen
                                    </Text>
                                </Stack>
                            </Center>
                        </Card>
                    ) : visibleGroups.length === 0 ? (
                        <Text ta="center" py="xl" size="sm" fw={600} c="dimmed">
                            Geen bestellingen gevonden voor dit filter.
                        </Text>
                    ) : (
                        visibleGroups.map((group) => (
                            <Stack key={group.key} gap="xs">
                                <Group gap="sm">
                                    <Title order={2} size="h5">
                                        {group.name}
                                    </Title>
                                    <Badge variant="light" size="sm">
                                        {group.rows.length} {group.rows.length === 1 ? 'bestelling' : 'bestellingen'}
                                    </Badge>
                                </Group>
                                <Card p={0} shadow="md" style={{ overflow: 'hidden' }}>
                                    <Table.ScrollContainer minWidth={600}>
                                        <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                            <Table.Thead>
                                                <Table.Tr>
                                                    <Table.Th>Lid</Table.Th>
                                                    <Table.Th>Maat</Table.Th>
                                                    <Table.Th>Aantal</Table.Th>
                                                    <Table.Th visibleFrom="md">Details</Table.Th>
                                                    <Table.Th visibleFrom="lg">Opgehaald op</Table.Th>
                                                    <Table.Th ta="right">Opgehaald</Table.Th>
                                                </Table.Tr>
                                            </Table.Thead>
                                            <Table.Tbody>
                                                {group.rows.map(({ order, line }) => {
                                                    const details = formatCustomFieldValues(line.custom_field_values).replace(/^ · /, '');
                                                    return (
                                                        <Table.Tr
                                                            key={`${order.id}-${line.id}`}
                                                            style={order.picked_up ? { opacity: 0.6 } : undefined}
                                                        >
                                                            <Table.Td>
                                                                <Text size="sm" fw={600}>
                                                                    {order.first_name} {order.last_name}
                                                                </Text>
                                                                <Text size="xs" c="dimmed">
                                                                    {order.email}
                                                                </Text>
                                                                {details && (
                                                                    <Text size="xs" mt={4} hiddenFrom="md">
                                                                        {details}
                                                                    </Text>
                                                                )}
                                                            </Table.Td>
                                                            <Table.Td>
                                                                {line.variant_label_snapshot ? (
                                                                    <Badge variant="light" tt="none">
                                                                        {line.variant_label_snapshot}
                                                                    </Badge>
                                                                ) : (
                                                                    <Text size="sm" c="dimmed">
                                                                        -
                                                                    </Text>
                                                                )}
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Text size="sm" fw={600}>
                                                                    &times; {line.quantity}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td visibleFrom="md">
                                                                <Text size="sm" c={details ? undefined : 'dimmed'}>
                                                                    {details || '-'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td visibleFrom="lg">
                                                                <Text size="sm" c="dimmed">
                                                                    {order.picked_up_at
                                                                        ? formatDate(new Date(order.picked_up_at), 'd MMM yyyy HH:mm')
                                                                        : '-'}
                                                                </Text>
                                                            </Table.Td>
                                                            <Table.Td>
                                                                <Group justify="flex-end">
                                                                    <Button
                                                                        type="button"
                                                                        size="xs"
                                                                        variant="light"
                                                                        color={order.picked_up ? 'success' : 'brand'}
                                                                        disabled={isPending && updatingId === order.id}
                                                                        onClick={() => handleToggle(order.id, !order.picked_up)}
                                                                        leftSection={<CheckCircle2 size={14} />}
                                                                    >
                                                                        {order.picked_up ? 'Opgehaald' : 'Markeer als opgehaald'}
                                                                    </Button>
                                                                </Group>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    );
                                                })}
                                            </Table.Tbody>
                                        </Table>
                                    </Table.ScrollContainer>
                                </Card>
                            </Stack>
                        ))
                    )}
                </Stack>
            </Container>
        </>
    );
}
