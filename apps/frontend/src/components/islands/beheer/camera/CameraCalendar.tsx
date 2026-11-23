'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Card,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import type { CameraAdminLoan, CameraAdminRequest } from '@salvemundi/validations';
import { formatDate } from '@/shared/lib/utils/date';

type EntryKind = 'out' | 'reserved' | 'requested';

interface Entry {
    key: string;
    kind: EntryKind;
    label: string;
    who: string;
    start: string;
    end: string;
    times: string | null;
}

const LEGEND: { kind: EntryKind; label: string; color: string; variant: 'filled' | 'light' }[] = [
    { kind: 'out', label: 'Uitgeleend', color: 'brand', variant: 'filled' },
    { kind: 'reserved', label: 'Gereserveerd', color: 'success', variant: 'light' },
    { kind: 'requested', label: 'Aangevraagd', color: 'accent', variant: 'light' },
];

function getKindMeta(kind: EntryKind): { label: string; color: string; variant: 'filled' | 'light' } {
    switch (kind) {
        case 'out':
            return { label: 'Uitgeleend', color: 'brand', variant: 'filled' };
        case 'reserved':
            return { label: 'Gereserveerd', color: 'success', variant: 'light' };
        case 'requested':
            return { label: 'Aangevraagd', color: 'accent', variant: 'light' };
    }
}

const WEEKDAYS = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function CameraCalendar({
    requests,
    loans,
    today,
}: {
    requests: CameraAdminRequest[];
    loans: CameraAdminLoan[];
    today: string;
}) {
    const [year, setYear] = useState(Number(today.slice(0, 4)));
    const [month, setMonth] = useState(Number(today.slice(5, 7)) - 1);
    const [selected, setSelected] = useState<string>(today);

    const entries = useMemo<Entry[]>(() => {
        const loanned = new Set(loans.map((l) => l.request_id));
        const fromLoans: Entry[] = loans.map((l) => ({
            key: `loan-${l.id}`,
            kind: 'out',
            label: l.event_name,
            who: l.borrower_name,
            start: l.start_date,
            end: l.returned_on ?? (today > l.agreed_end_date ? today : l.agreed_end_date),
            times: null,
        }));
        const fromRequests: Entry[] = requests
            .filter((r) => (r.status === 'approved' || r.status === 'requested') && !loanned.has(r.id))
            .map((r) => ({
                key: `req-${r.id}`,
                kind: r.status === 'approved' ? 'reserved' : 'requested',
                label: r.event_name,
                who: r.requester_name,
                start: r.start_date,
                end: r.end_date,
                times: r.start_time || r.end_time ? `${r.start_time ?? ''}–${r.end_time ?? ''}` : null,
            }));
        return [...fromLoans, ...fromRequests];
    }, [requests, loans, today]);

    const cells = useMemo(() => {
        const first = new Date(Date.UTC(year, month, 1));
        const offset = (first.getUTCDay() + 6) % 7;
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        const out: (string | null)[] = Array.from({ length: offset }, () => null);
        for (let d = 1; d <= daysInMonth; d++) out.push(toKey(year, month, d));
        while (out.length % 7 !== 0) out.push(null);
        return out;
    }, [year, month]);

    const forDay = (day: string) => entries.filter((e) => e.start <= day && day <= e.end);

    const shift = (delta: number) => {
        const d = new Date(Date.UTC(year, month + delta, 1));
        setYear(d.getUTCFullYear());
        setMonth(d.getUTCMonth());
    };

    const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString('nl-NL', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });
    const selectedEntries = forDay(selected);

    return (
        <Stack gap="md">
            <Group justify="space-between" align="center">
                <ActionIcon
                    type="button"
                    onClick={() => shift(-1)}
                    aria-label="Vorige maand"
                >
                    <ChevronLeft size={16} />
                </ActionIcon>
                <Title order={3} size="h5" tt="capitalize">{monthLabel}</Title>
                <ActionIcon
                    type="button"
                    onClick={() => shift(1)}
                    aria-label="Volgende maand"
                >
                    <ChevronRight size={16} />
                </ActionIcon>
            </Group>

            <Group gap="md" wrap="wrap">
                {LEGEND.map(({ kind, label, color, variant }) => (
                    <Badge key={kind} color={color} variant={variant} size="sm">
                        {label}
                    </Badge>
                ))}
                <Badge size="sm">
                    Beschikbaar
                </Badge>
            </Group>

            <SimpleGrid cols={7} spacing={4}>
                {WEEKDAYS.map((w) => (
                    <Text key={w} ta="center" size="xs" fw={600} c="dimmed" tt="uppercase">
                        {w}
                    </Text>
                ))}
            </SimpleGrid>

            <SimpleGrid cols={7} spacing={4}>
                {cells.map((day, i) => {
                    if (!day) return <Box key={`empty-${i}`} />;
                    const dayEntries = forDay(day);
                    const isSelected = day === selected;
                    const isToday = day === today;
                    return (
                        <Paper
                            key={day}
                            component="button"
                            type="button"
                            withBorder
                            p={6}
                            onClick={() => setSelected(day)}
                            style={{
                                minHeight: 76,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                gap: 2,
                                textAlign: 'left',
                                cursor: 'pointer',
                                borderColor: isSelected ? 'var(--mantine-color-brand-filled)' : undefined,
                                boxShadow: isSelected ? '0 0 0 1px var(--mantine-color-brand-filled)' : undefined,
                                backgroundColor: isToday ? 'var(--mantine-color-brand-light)' : undefined,
                            }}
                        >
                            <Text size="xs" fw={700}>{Number(day.slice(8))}</Text>
                            {dayEntries.slice(0, 2).map((e) => {
                                const meta = getKindMeta(e.kind);
                                return (
                                    <Badge
                                        key={e.key}
                                        color={meta.color}
                                        variant={meta.variant}
                                        size="xs"
                                        fullWidth
                                    >
                                        {e.label}
                                    </Badge>
                                );
                            })}
                            {dayEntries.length > 2 && (
                                <Text size="xs" fw={700} c="dimmed">+{dayEntries.length - 2}</Text>
                            )}
                        </Paper>
                    );
                })}
            </SimpleGrid>

            <Card withBorder padding="md">
                <Stack gap="xs">
                    <Title order={4} size="xs">
                        {formatDate(selected, 'EEEE d MMMM yyyy')}
                    </Title>
                    {selectedEntries.length === 0 ? (
                        <Text size="xs" fw={600} c="success">
                            De camera is deze dag beschikbaar.
                        </Text>
                    ) : (
                        <Stack gap={6}>
                            {selectedEntries.map((e) => {
                                const meta = getKindMeta(e.kind);
                                return (
                                    <Group key={e.key} gap="xs" wrap="wrap">
                                        <Badge
                                            color={meta.color}
                                            variant={meta.variant}
                                            size="xs"
                                        >
                                            {meta.label}
                                        </Badge>
                                        <Text size="xs" fw={700}>{e.label}</Text>
                                        <Text size="xs" c="dimmed">
                                            {e.who} · {formatDate(e.start, 'd MMM')} – {formatDate(e.end, 'd MMM')}
                                            {e.times && ` · ${e.times}`}
                                        </Text>
                                    </Group>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </Card>
        </Stack>
    );
}
