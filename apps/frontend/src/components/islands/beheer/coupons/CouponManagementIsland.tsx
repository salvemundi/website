'use client';

import {
    useState, useTransition, useMemo
} from 'react';
import Link from 'next/link';
import {
    Ticket, Plus, CheckCircle, Clock, ToggleLeft, ToggleRight, ChevronLeft
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Collapse,
    Container,
    Group,
    Modal,
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { type Coupon } from './coupon-types';
import { getComputedCouponStatus } from '@/lib/coupons';
import { createCoupon, deleteCoupon, toggleCouponActive } from '@/server/actions/beheer/coupons/beheer-coupons.actions';
import CouponRow from './CouponRow';
import CouponForm from './CouponForm';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface Props {
    initialCoupons?: Coupon[];
}

export default function CouponManagementIsland({
    initialCoupons = []
}: Props) {
    const { showToast } = useAdminToast();
    const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons);
    const [isAdding, setIsAdding] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [togglingId, setTogglingId] = useState<number | null>(null);
    const [showExpired, setShowExpired] = useState(false);

    const { validCoupons, inactiveCoupons } = useMemo(() => {
        const valid: Coupon[] = [];
        const inactive: Coupon[] = [];

        coupons.forEach(c => {
            const status = getComputedCouponStatus(c);
            if (status.type !== 'expired') {
                valid.push(c);
            } else {
                inactive.push(c);
            }
        });

        return { validCoupons: valid, inactiveCoupons: inactive };
    }, [coupons]);

    const handleCreate = async (formData: FormData, discountType: 'fixed' | 'percentage') => {
        setFormError(null);
        formData.set('discount_type', discountType);

        const code = (formData.get('coupon_code') as string || '').toUpperCase();
        const value = Number(formData.get('discount_value'));
        const isActive = formData.get('is_active') === 'on';

        const tempId = -Math.floor(Math.random() * 1000000);
        const tempCoupon: Coupon = {
            id: tempId,
            coupon_code: code,
            discount_type: discountType,
            discount_value: value,
            usage_count: 0,
            usage_limit: formData.get('usage_limit') ? Number(formData.get('usage_limit')) : null,
            valid_from: (formData.get('valid_from') as string) || null,
            valid_until: (formData.get('valid_until') as string) || null,
            is_active: isActive,
            isOptimistic: true
        };

        setCoupons(prev => [tempCoupon, ...prev]);
        setIsAdding(false);

        startTransition(async () => {
            const res = await createCoupon(formData);

            if (!res.success) {
                setFormError(res.error ?? 'Aanmaken mislukt');
                setCoupons(prev => prev.filter(c => c.id !== tempId));
                setIsAdding(true);
                return;
            }

            const newCoupon = res.data;
            if (newCoupon) {
                setCoupons(prev => prev.map(c => c.id === tempId ? newCoupon : c));
            }
        });
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Weet je zeker dat je deze coupon wilt verwijderen?')) return;
        setDeletingId(id);
        const res = await deleteCoupon(Number(id));
        if (res.success) {
            setCoupons(prev => prev.filter(c => c.id !== id));
            showToast('Coupon succesvol verwijderd', 'success');
        } else {
            showToast(res.error ?? 'Verwijderen mislukt', 'error');
        }
        setDeletingId(null);
    };

    const handleToggle = async (coupon: Coupon) => {
        setTogglingId(coupon.id);
        const res = await toggleCouponActive(coupon.id, coupon.is_active);
        if (res.success) {
            setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, is_active: !c.is_active } : c));
            showToast(`Coupon ${coupon.is_active ? 'gedeactiveerd' : 'geactiveerd'}`, 'success');
        } else {
            showToast(res.error ?? 'Bijwerken mislukt', 'error');
        }
        setTogglingId(null);
    };

    const adminStats = [
        { label: 'Totaal', value: coupons.length, icon: Ticket },
        { label: 'Nu Actief', value: coupons.filter(c => getComputedCouponStatus(c).type === 'active').length, icon: CheckCircle },
        { label: 'Verlopen', value: coupons.filter(c => getComputedCouponStatus(c).type === 'expired').length, icon: Clock },
        { label: 'Gebruikt', value: coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0), icon: Ticket },
    ];

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Group justify="space-between" align="center" wrap="wrap" gap="md">
                    <Group gap="md" align="center">
                        <ActionIcon
                            component={Link}
                            href="/beheer"
                            size="lg"
                            aria-label="Terug"
                        >
                            <ChevronLeft size={18} />
                        </ActionIcon>
                        <Title order={1} size="h2" c="brand">
                            Coupons Beheer
                        </Title>
                    </Group>

                    <Button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        leftSection={<Plus size={16} />}
                    >
                        Nieuwe Coupon
                    </Button>
                </Group>

                <Modal
                    opened={isAdding}
                    onClose={() => setIsAdding(false)}
                    title="Nieuwe Coupon Aanmaken"
                    size="xl"
                    centered
                >
                    <CouponForm
                        onSave={(formData, discountType) => { void handleCreate(formData, discountType); }}
                        onCancel={() => setIsAdding(false)}
                        isPending={isPending}
                        error={formError}
                    />
                </Modal>

                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                    {adminStats.map((stat) => (
                        <Paper key={stat.label} withBorder p="md">
                            <Group justify="space-between" align="center" wrap="nowrap">
                                <Stack gap={2}>
                                    <Text size="xs" c="dimmed" fw={600}>
                                        {stat.label}
                                    </Text>
                                    <Text size="xl" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
                                        {stat.value}
                                    </Text>
                                </Stack>
                                <ThemeIcon size="lg">
                                    <stat.icon size={18} />
                                </ThemeIcon>
                            </Group>
                        </Paper>
                    ))}
                </SimpleGrid>

                <Stack gap="md">
                    <Group gap="sm">
                        <Title order={2} size="h4">Coupons</Title>
                        <Badge color="success">{validCoupons.length}</Badge>
                    </Group>

                    <Card withBorder padding={0} style={{ overflow: 'hidden' }}>
                        {validCoupons.length === 0 ? (
                            <Stack align="center" gap="xs" py="xl">
                                <Ticket size={40} opacity={0.2} />
                                <Text size="sm" fw={600} c="dimmed">Geen coupons gevonden</Text>
                            </Stack>
                        ) : (
                            <Table.ScrollContainer minWidth={600}>
                                <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                    <Table.Thead>
                                        <Table.Tr>
                                            <Table.Th>Code</Table.Th>
                                            <Table.Th>Korting</Table.Th>
                                            <Table.Th visibleFrom="sm">Gebruik</Table.Th>
                                            <Table.Th visibleFrom="lg">Geldigheid</Table.Th>
                                            <Table.Th ta="center">Status</Table.Th>
                                            <Table.Th ta="right">Acties</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {validCoupons.map(coupon => (
                                            <CouponRow
                                                key={coupon.id}
                                                coupon={coupon}
                                                onToggle={(c) => { void handleToggle(c); }}
                                                onDelete={(id) => { void handleDelete(id); }}
                                                isToggling={togglingId === coupon.id}
                                                isDeleting={deletingId === coupon.id}
                                            />
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>
                        )}
                    </Card>
                </Stack>

                <Stack gap="md">
                    <Group>
                        <Button
                            type="button"
                            onClick={() => setShowExpired(!showExpired)}
                            leftSection={showExpired ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            rightSection={<Badge size="sm">{inactiveCoupons.length}</Badge>}
                        >
                            Verlopen Coupons
                        </Button>
                    </Group>

                    <Collapse expanded={showExpired}>
                        <Card withBorder padding={0} style={{ overflow: 'hidden', opacity: 0.85 }}>
                            {inactiveCoupons.length === 0 ? (
                                <Text py="xl" ta="center" size="xs" fw={600} c="dimmed" fs="italic">
                                    Niets gevonden
                                </Text>
                            ) : (
                                <Table.ScrollContainer minWidth={600}>
                                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                                        <Table.Tbody>
                                            {inactiveCoupons.map(coupon => (
                                                <CouponRow
                                                    key={coupon.id}
                                                    coupon={coupon}
                                                    onToggle={(c) => { void handleToggle(c); }}
                                                    onDelete={(id) => { void handleDelete(id); }}
                                                    isToggling={togglingId === coupon.id}
                                                    isDeleting={deletingId === coupon.id}
                                                />
                                            ))}
                                        </Table.Tbody>
                                    </Table>
                                </Table.ScrollContainer>
                            )}
                        </Card>
                    </Collapse>
                </Stack>
            </Stack>
        </Container>
    );
}
