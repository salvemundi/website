'use client';

import { useState, useTransition } from 'react';
import {
    Package,
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
    CalendarClock,
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Container,
    Group,
    Modal,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import BeheerWebshopDropWindowForm from './BeheerWebshopDropWindowForm';
import BeheerWebshopProductForm from './BeheerWebshopProductForm';
import {
    saveDropWindow,
    deleteDropWindow,
    saveProduct,
    deleteProduct,
    toggleProductActive,
} from '@/server/actions/beheer/webshop/beheer-webshop-products.actions';
import { formatDate } from '@/shared/lib/utils/date';
import { type AdminDropWindow, type AdminProduct } from './webshop-admin-types';

interface Props {
    initialDropWindows: AdminDropWindow[];
    initialProducts: AdminProduct[];
}

function getDropStatusMeta(status: string | null): { label: string; color?: string } {
    switch (status) {
        case 'draft':
            return { label: 'Concept', color: 'accent' };
        case 'open':
            return { label: 'Open', color: 'success' };
        case 'closed':
            return { label: 'Gesloten' };
        case null:
            return { label: 'Onbekend' };
        default:
            return { label: status };
    }
}

function variantLabel(v: { size: string | null; color: string | null }): string {
    return [v.size, v.color].filter(Boolean).join('/');
}

function StockBadge({ product }: { product: AdminProduct }) {
    const activeVariants = product.variants.filter((v) => v.is_active);
    const hasVariantStock = activeVariants.some((v) => v.stock_quantity !== null && v.stock_quantity !== undefined);
    const total = product.stock_quantity ?? null;

    return (
        <Stack gap={4}>
            {total === 0 ? (
                <Badge size="sm" color="error">
                    Uitverkocht
                </Badge>
            ) : total !== null ? (
                <Text size="sm">{total} stuks totaal</Text>
            ) : (
                !hasVariantStock && (
                    <Text size="sm" c="dimmed">
                        Onbeperkt
                    </Text>
                )
            )}
            {hasVariantStock && (
                <Group gap={4} maw={240}>
                    {activeVariants.map((v) => (
                        <Badge
                            key={v.id}
                            size="xs"
                            color={v.stock_quantity === 0 ? 'error' : 'gray'}
                            tt="none"
                        >
                            {variantLabel(v)}: {v.stock_quantity ?? '∞'}
                        </Badge>
                    ))}
                </Group>
            )}
        </Stack>
    );
}

function SalesCell({ product }: { product: AdminProduct }) {
    const sales = product.sales;
    if (!sales || (sales.paid === 0 && sales.pending === 0)) {
        return (
            <Text size="sm" c="dimmed">
                0
            </Text>
        );
    }
    return (
        <Stack gap={4}>
            <Text size="sm" fw={600}>
                {sales.paid} betaald
                {sales.pending > 0 && (
                    <Text span size="xs" c="accent" fw={400} ml={4}>
                        +{sales.pending} open
                    </Text>
                )}
            </Text>
            {sales.byVariant.length > 0 && (
                <Group gap={4} maw={240}>
                    {sales.byVariant.map((v) => (
                        <Badge
                            key={v.label}
                            size="xs"
                            tt="none"
                            title={v.pending > 0 ? `${v.pending} wacht nog op betaling` : undefined}
                        >
                            {v.label}: {v.paid}
                            {v.pending > 0 && ` +${v.pending}`}
                        </Badge>
                    ))}
                </Group>
            )}
        </Stack>
    );
}

export default function BeheerWebshopProductsIsland({
    initialDropWindows,
    initialProducts,
}: Props) {
    const { showToast } = useAdminToast();
    const [dropWindows, setDropWindows] = useState(initialDropWindows);
    const [products, setProducts] = useState(initialProducts);
    const [isPending, startTransition] = useTransition();
    const [formError, setFormError] = useState<string | null>(null);

    const [dropWindowModal, setDropWindowModal] = useState<{
        open: boolean;
        editing: AdminDropWindow | null;
    }>({ open: false, editing: null });
    const [productModal, setProductModal] = useState<{
        open: boolean;
        editing: AdminProduct | null;
    }>({ open: false, editing: null });
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const dropWindowById = new Map(dropWindows.map((dw) => [dw.id, dw]));

    const handleSaveDropWindow = (formData: FormData) => {
        setFormError(null);
        startTransition(async () => {
            const res = await saveDropWindow(formData);
            if (!res.success) {
                setFormError(res.error || 'Opslaan mislukt.');
                return;
            }
            setDropWindowModal({ open: false, editing: null });
            showToast('Drop opgeslagen', 'success');
            window.location.reload();
        });
    };

    const handleDeleteDropWindow = (id: number) => {
        if (!confirm('Weet je zeker dat je deze drop wilt verwijderen?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteDropWindow(id);
            if (res.success) {
                setDropWindows((prev) => prev.filter((dw) => dw.id !== id));
                showToast('Drop verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
            setDeletingId(null);
        });
    };

    const handleSaveProduct = (formData: FormData) => {
        setFormError(null);
        startTransition(async () => {
            const res = await saveProduct(formData);
            if (!res.success) {
                setFormError(res.error || 'Opslaan mislukt.');
                return;
            }
            setProductModal({ open: false, editing: null });
            showToast('Product opgeslagen', 'success');
            window.location.reload();
        });
    };

    const handleDeleteProduct = (id: number) => {
        if (!confirm('Weet je zeker dat je dit product wilt verwijderen?')) return;
        setDeletingId(id);
        startTransition(async () => {
            const res = await deleteProduct(id);
            if (res.success) {
                setProducts((prev) => prev.filter((p) => p.id !== id));
                showToast('Product verwijderd', 'success');
            } else {
                showToast(res.error || 'Verwijderen mislukt', 'error');
            }
            setDeletingId(null);
        });
    };

    const handleToggleActive = (product: AdminProduct) => {
        setTogglingId(product.id);
        startTransition(async () => {
            const res = await toggleProductActive(product.id, !!product.is_active);
            if (res.success) {
                setProducts((prev) =>
                    prev.map((p) => (p.id === product.id ? { ...p, is_active: !p.is_active } : p))
                );
                showToast(
                    `Product ${product.is_active ? 'gedeactiveerd' : 'geactiveerd'}`,
                    'success'
                );
            } else {
                showToast(res.error || 'Bijwerken mislukt', 'error');
            }
            setTogglingId(null);
        });
    };

    return (
        <>
            <Container size="xl" py="lg">
                <Stack gap={40}>
                    <Stack gap="md">
                        <Group justify="space-between" wrap="wrap" gap="md">
                            <Group gap="sm">
                                <Title order={2} size="h4">
                                    Drops
                                </Title>
                                <Badge>
                                    {dropWindows.length}
                                </Badge>
                            </Group>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setDropWindowModal({ open: true, editing: null })}
                                leftSection={<Plus size={16} />}
                            >
                                Nieuwe drop
                            </Button>
                        </Group>

                        <Card p={0} shadow="md" style={{ overflow: 'hidden' }}>
                            {dropWindows.length === 0 ? (
                                <Center py={64}>
                                    <Stack align="center" gap="xs">
                                        <Text span c="dimmed" lh={1}>
                                            <CalendarClock size={40} />
                                        </Text>
                                        <Text size="sm" fw={600} c="dimmed">
                                            Nog geen drops aangemaakt
                                        </Text>
                                    </Stack>
                                </Center>
                            ) : (
                                <Table.ScrollContainer minWidth={500}>
                                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Naam</Table.Th>
                                                <Table.Th>Status</Table.Th>
                                                <Table.Th visibleFrom="sm">Sluit op</Table.Th>
                                                <Table.Th ta="right">Acties</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {dropWindows.map((dw) => {
                                                const statusMeta = getDropStatusMeta(dw.status);
                                                return (
                                                    <Table.Tr key={dw.id}>
                                                        <Table.Td>
                                                            <Text size="sm" fw={600}>
                                                                {dw.name}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Badge
                                                                size="sm"
                                                                variant={statusMeta.color ? 'light' : 'default'}
                                                                color={statusMeta.color}
                                                            >
                                                                {statusMeta.label}
                                                            </Badge>
                                                        </Table.Td>
                                                        <Table.Td visibleFrom="sm">
                                                            <Text size="sm" c="dimmed">
                                                                {dw.closes_at
                                                                    ? formatDate(
                                                                          new Date(dw.closes_at),
                                                                          'd MMMM yyyy HH:mm'
                                                                      )
                                                                    : '-'}
                                                            </Text>
                                                        </Table.Td>
                                                        <Table.Td>
                                                            <Group justify="flex-end" gap="xs">
                                                                <ActionIcon
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setDropWindowModal({
                                                                            open: true,
                                                                            editing: dw,
                                                                        })
                                                                    }
                                                                    aria-label="Bewerken"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </ActionIcon>
                                                                <ActionIcon
                                                                    type="button"
                                                                    color="error"
                                                                    onClick={() => handleDeleteDropWindow(dw.id)}
                                                                    disabled={deletingId === dw.id}
                                                                    aria-label="Verwijderen"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </ActionIcon>
                                                            </Group>
                                                        </Table.Td>
                                                    </Table.Tr>
                                                );
                                            })}
                                        </Table.Tbody>
                                    </Table>
                                </Table.ScrollContainer>
                            )}
                        </Card>
                    </Stack>

                    <Stack gap="md">
                        <Group justify="space-between" wrap="wrap" gap="md">
                            <Group gap="sm">
                                <Title order={2} size="h4">
                                    Producten
                                </Title>
                                <Badge>
                                    {products.length}
                                </Badge>
                            </Group>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => setProductModal({ open: true, editing: null })}
                                leftSection={<Plus size={16} />}
                            >
                                Nieuw product
                            </Button>
                        </Group>

                        <Card p={0} shadow="md" style={{ overflow: 'hidden' }}>
                            {products.length === 0 ? (
                                <Center py={64}>
                                    <Stack align="center" gap="xs">
                                        <Text span c="dimmed" lh={1}>
                                            <Package size={40} />
                                        </Text>
                                        <Text size="sm" fw={600} c="dimmed">
                                            Nog geen producten aangemaakt
                                        </Text>
                                    </Stack>
                                </Center>
                            ) : (
                                <Table.ScrollContainer minWidth={650}>
                                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                        <Table.Thead>
                                            <Table.Tr>
                                                <Table.Th>Naam</Table.Th>
                                                <Table.Th visibleFrom="sm">Type</Table.Th>
                                                <Table.Th visibleFrom="lg">Drop</Table.Th>
                                                <Table.Th>Prijs</Table.Th>
                                                <Table.Th>Voorraad</Table.Th>
                                                <Table.Th>Verkocht</Table.Th>
                                                <Table.Th ta="center">Actief</Table.Th>
                                                <Table.Th ta="right">Acties</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {products.map((product) => (
                                                <Table.Tr key={product.id}>
                                                    <Table.Td>
                                                        <Text size="sm" fw={600}>
                                                            {product.name}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td visibleFrom="sm">
                                                        <Text size="sm" c="dimmed" tt="capitalize">
                                                            {product.type}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td visibleFrom="lg">
                                                        <Text size="sm" c="dimmed">
                                                            {product.drop_window_id
                                                                ? dropWindowById.get(product.drop_window_id)
                                                                      ?.name || '-'
                                                                : '-'}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Text size="sm" c="dimmed">
                                                            €{Number(product.price).toFixed(2)}
                                                        </Text>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <StockBadge product={product} />
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <SalesCell product={product} />
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Box ta="center">
                                                            <ActionIcon
                                                                type="button"
                                                                color={product.is_active ? 'success' : 'brand'}
                                                                onClick={() => handleToggleActive(product)}
                                                                disabled={togglingId === product.id}
                                                                aria-label={
                                                                    product.is_active
                                                                        ? 'Product deactiveren'
                                                                        : 'Product activeren'
                                                                }
                                                            >
                                                                {product.is_active ? (
                                                                    <ToggleRight size={22} />
                                                                ) : (
                                                                    <ToggleLeft size={22} />
                                                                )}
                                                            </ActionIcon>
                                                        </Box>
                                                    </Table.Td>
                                                    <Table.Td>
                                                        <Group justify="flex-end" gap="xs">
                                                            <ActionIcon
                                                                type="button"
                                                                onClick={() =>
                                                                    setProductModal({
                                                                        open: true,
                                                                        editing: product,
                                                                    })
                                                                }
                                                                aria-label="Bewerken"
                                                            >
                                                                <Edit2 size={16} />
                                                            </ActionIcon>
                                                            <ActionIcon
                                                                type="button"
                                                                color="error"
                                                                onClick={() => handleDeleteProduct(product.id)}
                                                                disabled={deletingId === product.id}
                                                                aria-label="Verwijderen"
                                                            >
                                                                <Trash2 size={16} />
                                                            </ActionIcon>
                                                        </Group>
                                                    </Table.Td>
                                                </Table.Tr>
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Table.ScrollContainer>
                            )}
                        </Card>
                    </Stack>
                </Stack>
            </Container>

            <Modal
                opened={dropWindowModal.open}
                onClose={() => {
                    setDropWindowModal({ open: false, editing: null });
                    setFormError(null);
                }}
                title={dropWindowModal.editing ? 'Drop Bewerken' : 'Nieuwe Drop Aanmaken'}
                size="lg"
                centered
            >
                <BeheerWebshopDropWindowForm
                    dropWindow={dropWindowModal.editing}
                    onSave={handleSaveDropWindow}
                    onCancel={() => {
                        setDropWindowModal({ open: false, editing: null });
                        setFormError(null);
                    }}
                    isPending={isPending}
                    error={formError}
                />
            </Modal>

            <Modal
                opened={productModal.open}
                onClose={() => {
                    setProductModal({ open: false, editing: null });
                    setFormError(null);
                }}
                title={productModal.editing ? 'Product Bewerken' : 'Nieuw Product Aanmaken'}
                size="xl"
                centered
            >
                <BeheerWebshopProductForm
                    product={productModal.editing}
                    dropWindows={dropWindows}
                    onSave={handleSaveProduct}
                    onCancel={() => {
                        setProductModal({ open: false, editing: null });
                        setFormError(null);
                    }}
                    isPending={isPending}
                    error={formError}
                />
            </Modal>
        </>
    );
}
