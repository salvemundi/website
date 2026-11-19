'use client';

import { Edit, Trash, ChevronDown, Bus, Briefcase, CheckCircle2, Clock, XCircle, List } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Loader,
    Menu,
    Stack,
    Text,
} from '@mantine/core';
import type { TripSignup, TripSignupActivity } from '@salvemundi/validations/schema/trip.zod';

interface ReisTableRowProps {
    signup: TripSignup;
    isSelected: boolean;
    onSelect: (signup: TripSignup, edit?: boolean) => void;
    statusBadge: { label: string; color: string };
    paymentStatus: { label: string; color: string };
    isStatusLoading: boolean;
    isDeleteLoading: boolean;
    sendingEmailType: string | null;
    onStatusChange: (id: number, status: string) => void;
    onDelete: (id: number) => void;
    onResendEmail: (id: number, type: 'deposit' | 'final') => void;
    activities: TripSignupActivity[];
    allowFinalPayments: boolean;
    isBusTrip?: boolean;
}

function getPaymentBadgeColor(signup: TripSignup): string {
    if (signup.full_payment_paid) return 'success';
    if (signup.deposit_paid) return 'accent';
    return 'error';
}

export default function ReisTableRow({
    signup,
    isSelected,
    onSelect,
    paymentStatus,
    isStatusLoading,
    isDeleteLoading,
    onStatusChange,
    onDelete,
    isBusTrip = false
}: ReisTableRowProps) {
    return (
        <Card
            withBorder
            radius="lg"
            padding="md"
            h="100%"
            onClick={() => onSelect(signup)}
            style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                borderColor: isSelected ? 'var(--mantine-color-accent-filled)' : undefined,
            }}
        >
            <Stack gap="sm" style={{ flex: 1 }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                    <Stack gap={2} style={{ minWidth: 0, flex: 1 }}>
                        <Text size="xs" fw={600} c="accent">
                            {signup.role === 'crew' ? 'Crew' : 'Deelnemer'}
                        </Text>
                        <Text size="lg" fw={600} lh={1.3} lineClamp={2} mih={44}>
                            {signup.first_name} {signup.last_name}
                        </Text>
                    </Stack>

                    <Group gap={4} wrap="nowrap">
                        <ActionIcon
                            type="button"
                            variant="default"
                            size="md"
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelect(signup, true);
                            }}
                            title="Bewerken"
                            aria-label="Bewerken"
                        >
                            <Edit size={15} />
                        </ActionIcon>
                        <ActionIcon
                            type="button"
                            variant="subtle"
                            color="error"
                            size="md"
                            disabled={isDeleteLoading}
                            loading={isDeleteLoading}
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(signup.id);
                            }}
                            title="Verwijderen"
                            aria-label="Verwijderen"
                        >
                            <Trash size={15} />
                        </ActionIcon>
                    </Group>
                </Group>

                <Stack gap={4}>
                    <Text size="xs" c="dimmed" truncate="end">
                        {signup.email}
                    </Text>
                    <Group justify="space-between" wrap="wrap" gap="xs">
                        <Text size="xs" fw={600} c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {signup.date_of_birth
                                ? new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(signup.date_of_birth))
                                : '-'}
                        </Text>

                        <Group gap="xs">
                            {isBusTrip && signup.willing_to_drive && (
                                <Badge color="success" variant="light" size="xs" leftSection={<Bus size={10} />}>
                                    Chauffeur
                                </Badge>
                            )}
                            {!isBusTrip && signup.extra_luggage && (
                                <Badge color="brand" variant="light" size="xs" leftSection={<Briefcase size={10} />}>
                                    +1 Koffer
                                </Badge>
                            )}
                        </Group>
                    </Group>
                </Stack>

                <Divider mt="auto" />

                <Group justify="space-between" wrap="wrap" gap="xs">
                    {isStatusLoading ? (
                        <Loader size="xs" color="accent" />
                    ) : (
                        <StatusDropdown
                            currentStatus={signup.status}
                            onChange={(val) => onStatusChange(signup.id, val)}
                        />
                    )}

                    <Badge color={getPaymentBadgeColor(signup)} variant="light" size="sm">
                        {paymentStatus.label}
                    </Badge>
                </Group>
            </Stack>
        </Card>
    );
}

const STATUSES = [
    {
        value: 'registered',
        label: 'Geregistreerd',
        icon: Clock,
        color: 'brand',
    },
    {
        value: 'confirmed',
        label: 'Bevestigd',
        icon: CheckCircle2,
        color: 'success',
    },
    {
        value: 'waitlist',
        label: 'Wachtlijst',
        icon: List,
        color: 'accent',
    },
    {
        value: 'cancelled',
        label: 'Geannuleerd',
        icon: XCircle,
        color: 'error',
    }
] as const;

function StatusDropdown({ currentStatus, onChange }: { currentStatus: string, onChange: (val: string) => void }) {
    const current = STATUSES.find(s => s.value === currentStatus) ?? STATUSES[0];

    return (
        <Menu position="top-start" withinPortal shadow="md">
            <Menu.Target>
                <Button
                    type="button"
                    size="compact-xs"
                    variant="light"
                    color={current.color}
                    onClick={(e) => e.stopPropagation()}
                    leftSection={<current.icon size={12} />}
                    rightSection={<ChevronDown size={12} />}
                >
                    {current.label}
                </Button>
            </Menu.Target>

            <Menu.Dropdown onClick={(e) => e.stopPropagation()}>
                {STATUSES.map((s) => {
                    const isSelected = currentStatus === s.value;
                    return (
                        <Menu.Item
                            key={s.value}
                            leftSection={<s.icon size={14} />}
                            color={isSelected ? s.color : undefined}
                            fw={isSelected ? 700 : 500}
                            onClick={() => onChange(s.value)}
                        >
                            {s.label}
                        </Menu.Item>
                    );
                })}
            </Menu.Dropdown>
        </Menu>
    );
}
