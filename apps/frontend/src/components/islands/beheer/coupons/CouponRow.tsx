'use client';

import {
    Ticket,
    Percent,
    CheckCircle,
    XCircle,
    Trash,
    ToggleLeft,
    ToggleRight
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Group,
    Loader,
    Progress,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Tooltip,
} from '@mantine/core';
import { type Coupon, type CouponStatus } from './coupon-types';
import { getComputedCouponStatus } from '@/lib/coupons';
import { formatDate } from '@/shared/lib/utils/date';

interface Props {
    coupon: Coupon;
    onToggle: (c: Coupon) => void;
    onDelete: (id: number) => void;
    isToggling: boolean;
    isDeleting: boolean;
}

function getStatusBadgeProps(statusType: CouponStatus): { color?: string; variant: 'light' | 'outline' | 'default' } {
    switch (statusType) {
        case 'active':
            return { color: 'success', variant: 'light' };
        case 'pending':
            return { color: 'accent', variant: 'light' };
        case 'maxed':
            return { color: 'accent', variant: 'outline' };
        case 'expired':
            return { color: 'error', variant: 'light' };
        case 'inactive':
            return { variant: 'default' };
    }
}

export default function CouponRow({
    coupon,
    onToggle,
    onDelete,
    isToggling,
    isDeleting
}: Props) {
    const status = getComputedCouponStatus(coupon);
    const isExpiredOrMaxed = status.type === 'expired' || status.type === 'maxed' || status.type === 'inactive';
    const badgeProps = getStatusBadgeProps(status.type);

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(val);

    return (
        <Table.Tr
            style={coupon.isOptimistic ? { opacity: 0.6, pointerEvents: 'none' } : undefined}
        >
            <Table.Td>
                <Group gap="sm" wrap="nowrap">
                    <ThemeIcon
                        color={isExpiredOrMaxed ? 'brand' : 'accent'}
                        size="lg"
                        style={isExpiredOrMaxed ? { opacity: 0.5 } : undefined}
                    >
                        <Ticket size={16} />
                    </ThemeIcon>
                    <Text
                        ff="monospace"
                        size="sm"
                        fw={600}
                        c={isExpiredOrMaxed ? 'dimmed' : undefined}
                    >
                        {coupon.coupon_code}
                    </Text>
                </Group>
            </Table.Td>

            <Table.Td>
                <Group gap={4} wrap="nowrap">
                    {coupon.discount_type === 'percentage' ? (
                        <Group gap={4} wrap="nowrap">
                            <Text span c={isExpiredOrMaxed ? 'dimmed' : 'accent'} lh={1}>
                                <Percent size={14} />
                            </Text>
                            <Text size="sm" fw={600} c={isExpiredOrMaxed ? 'dimmed' : 'accent'}>
                                {coupon.discount_value}%
                            </Text>
                        </Group>
                    ) : (
                        <Text size="sm" fw={600} c={isExpiredOrMaxed ? 'dimmed' : 'accent'}>
                            {formatCurrency(coupon.discount_value)}
                        </Text>
                    )}
                </Group>
            </Table.Td>

            <Table.Td visibleFrom="sm">
                <Stack gap={6} style={isExpiredOrMaxed ? { opacity: 0.5 } : undefined}>
                    <Text size="xs" fw={600}>
                        {coupon.usage_count}{' '}
                        <Text span c="dimmed">/ {coupon.usage_limit ?? '∞'}</Text>
                    </Text>
                    {coupon.usage_limit !== null && (
                        <Progress
                            value={Math.min((coupon.usage_count / coupon.usage_limit) * 100, 100)}
                            color={isExpiredOrMaxed ? 'brand' : 'accent'}
                            size="sm"
                            w={96}
                        />
                    )}
                </Stack>
            </Table.Td>

            <Table.Td visibleFrom="lg">
                <Stack gap={4}>
                    {coupon.valid_from && (
                        <Text size="xs" c="dimmed" fw={600}>
                            Van: {formatDate(coupon.valid_from)}
                        </Text>
                    )}
                    {coupon.valid_until ? (
                        <Text
                            size="xs"
                            fw={600}
                            c={status.type === 'expired' ? 'error' : 'dimmed'}
                        >
                            Tot: {formatDate(coupon.valid_until)}
                        </Text>
                    ) : (
                        <Text size="xs" c="dimmed" fs="italic">
                            Geen limiet
                        </Text>
                    )}
                </Stack>
            </Table.Td>

            <Table.Td ta="center">
                <Tooltip label={status.description}>
                    <Badge
                        color={badgeProps.color}
                        variant={badgeProps.variant}
                        size="md"
                        leftSection={
                            (status.type === 'active' || status.type === 'pending')
                                ? <CheckCircle size={12} />
                                : <XCircle size={12} />
                        }
                    >
                        {status.label}
                    </Badge>
                </Tooltip>
            </Table.Td>

            <Table.Td ta="right">
                <Group justify="flex-end" gap="xs" wrap="nowrap">
                    {coupon.isOptimistic ? (
                        <Loader size="sm" />
                    ) : (
                        <>
                            <ActionIcon
                                type="button"
                                color={coupon.is_active ? 'success' : 'brand'}
                                onClick={() => onToggle(coupon)}
                                loading={isToggling}
                                title={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                                aria-label={coupon.is_active ? 'Deactiveren' : 'Activeren'}
                            >
                                {coupon.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                            </ActionIcon>
                            <ActionIcon
                                type="button"
                                color="error"
                                onClick={() => onDelete(coupon.id)}
                                loading={isDeleting}
                                title="Verwijderen"
                                aria-label="Verwijderen"
                            >
                                <Trash size={16} />
                            </ActionIcon>
                        </>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    );
}
