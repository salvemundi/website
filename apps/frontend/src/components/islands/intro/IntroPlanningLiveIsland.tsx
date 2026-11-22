'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Clock, MapPin, Calendar, CalendarDays, ChevronDown, PartyPopper, ImageOff, X, ZoomIn, Sunrise } from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Collapse,
    Divider,
    Group,
    Modal,
    Paper,
    ScrollArea,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    UnstyledButton,
} from '@mantine/core';
import type { IntroPlanningItem } from '@salvemundi/validations/schema/intro.zod';
import { toLocalISOString } from '@/lib/utils/date-utils';
import { formatDate } from '@/shared/lib/utils/date';
import CalendarExportButton from '@/components/islands/activiteiten/CalendarExportButton';

const TOMORROW_OVERVIEW_HOUR = 22;

const HOUR_HEIGHT = 64;
const PX_PER_MINUTE = HOUR_HEIGHT / 60;
const DEFAULT_DURATION_MINUTES = 45;
const MIN_ITEM_HEIGHT = 30;

interface Props {
    planning: IntroPlanningItem[];
    planningImageUrl: string | null;
}

function nowKey(): string {
    return toLocalISOString(new Date(), true) || '';
}

function startKey(item: IntroPlanningItem): string {
    const t = item.time_start.length === 5 ? `${item.time_start}:00` : item.time_start;
    return `${item.date}T${t}`;
}

function endKey(item: IntroPlanningItem): string | null {
    if (!item.time_end) return null;
    const t = item.time_end.length === 5 ? `${item.time_end}:00` : item.time_end;
    return `${item.date}T${t}`;
}

function formatTimeRange(item: IntroPlanningItem): string {
    const start = item.time_start.slice(0, 5);
    if (!item.time_end) return start;
    return `${start} - ${item.time_end.slice(0, 5)}`;
}

const INLINE_FORMAT_PATTERN = /(\*\*.+?\*\*|__.+?__|\*.+?\*)/g;

function renderInlineFormatting(line: string): React.ReactNode[] {
    return line.split(INLINE_FORMAT_PATTERN).filter(part => part !== '').map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <Text span inherit fw={700} key={idx}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('__') && part.endsWith('__')) {
            return <Text span inherit td="underline" key={idx}>{part.slice(2, -2)}</Text>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <Text span inherit fs="italic" key={idx}>{part.slice(1, -1)}</Text>;
        }
        return part;
    });
}

function FormattedText({ text }: { text: string }) {
    const lines = text.split('\n');
    return (
        <Text span inherit style={{ whiteSpace: 'pre-line' }}>
            {lines.map((line, idx) => (
                <Fragment key={idx}>
                    {idx > 0 && '\n'}
                    {renderInlineFormatting(line)}
                </Fragment>
            ))}
        </Text>
    );
}

function addDays(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    dt.setUTCDate(dt.getUTCDate() + days);
    return dt.toISOString().slice(0, 10);
}

function toMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}

interface DayLayoutItem {
    item: IntroPlanningItem;
    top: number;
    height: number;
    col: number;
    cols: number;
}

function layoutDay(items: IntroPlanningItem[], startHour: number): DayLayoutItem[] {
    const withTimes = items
        .map(item => {
            const start = toMinutes(item.time_start);
            const rawEnd = item.time_end ? toMinutes(item.time_end) : start + DEFAULT_DURATION_MINUTES;
            return { item, start, end: Math.max(rawEnd, start + 15) };
        })
        .sort((a, b) => a.start - b.start);

    const columnEnds: number[] = [];
    const placed = withTimes.map(({ item, start, end }) => {
        let col = columnEnds.findIndex(colEnd => colEnd <= start);
        if (col === -1) {
            col = columnEnds.length;
            columnEnds.push(end);
        } else {
            columnEnds.splice(col, 1, end);
        }
        return { item, start, end, col };
    });

    const cols = Math.max(1, columnEnds.length);
    return placed.map(({ item, start, end, col }) => ({
        item,
        top: (start - startHour * 60) * PX_PER_MINUTE,
        height: Math.max((end - start) * PX_PER_MINUTE, MIN_ITEM_HEIGHT),
        col,
        cols
    }));
}

function ActivityCard({
    label,
    item,
    accent,
    icon: Icon
}: {
    label: string;
    item: IntroPlanningItem | null;
    accent: 'live' | 'next';
    icon: React.ComponentType<{ size?: number }>;
}) {
    const isLive = accent === 'live';

    return (
        <Card
            padding="lg"
            withBorder={!isLive}
            shadow="lg"
            style={isLive ? { backgroundColor: 'var(--mantine-color-brand-filled)', color: 'var(--mantine-color-white)' } : undefined}
        >
            <Stack gap="sm">
                <Group gap="xs">
                    {isLive && (
                        <Box
                            w={8}
                            h={8}
                            style={{ borderRadius: '9999px', backgroundColor: 'var(--mantine-color-white)' }}
                        />
                    )}
                    <Text
                        size="xs"
                        fw={900}
                        tt="uppercase"
                        c={isLive ? 'white' : 'brand'}
                        style={isLive ? { opacity: 0.85 } : undefined}
                    >
                        {label}
                    </Text>
                </Group>

                {item ? (
                    <Stack gap="xs">
                        <Title order={3} size="h3" c={isLive ? 'white' : undefined}>
                            {item.title}
                        </Title>
                        <Group gap="md" wrap="wrap" c={isLive ? 'white' : 'dimmed'} style={isLive ? { opacity: 0.9 } : undefined}>
                            <Group gap={6}>
                                <Clock size={16} />
                                <Text size="sm" fw={600}>
                                    {formatTimeRange(item)}
                                </Text>
                            </Group>
                            {item.location && (
                                <Group gap={6}>
                                    <MapPin size={16} />
                                    <Text size="sm" fw={600}>
                                        {item.location}
                                    </Text>
                                </Group>
                            )}
                        </Group>
                        {item.description && (
                            <Text size="sm" c={isLive ? 'white' : 'dimmed'} style={isLive ? { opacity: 0.85 } : undefined}>
                                <FormattedText text={item.description} />
                            </Text>
                        )}
                    </Stack>
                ) : (
                    <Group gap="xs" c={isLive ? 'white' : 'dimmed'} style={isLive ? { opacity: 0.85 } : undefined}>
                        <Icon size={16} />
                        <Text size="sm" fw={600}>
                            {isLive ? 'Er is nu geen activiteit bezig' : 'De introweek zit erop, tot volgend jaar!'}
                        </Text>
                    </Group>
                )}
            </Stack>
        </Card>
    );
}

export default function IntroPlanningLiveIsland({ planning, planningImageUrl }: Props) {
    const searchParams = useSearchParams();
    const previewTomorrow = searchParams.get('previewTomorrow') === '1';

    const [now, setNow] = useState('');
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [fullPlanningOpen, setFullPlanningOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [selectedGridItemId, setSelectedGridItemId] = useState<number | null>(null);
    const [imageHovered, setImageHovered] = useState(false);

    useEffect(() => {
        setNow(nowKey());
        const id = setInterval(() => setNow(nowKey()), 30000);
        return () => clearInterval(id);
    }, []);

    const sorted = useMemo(
        () => [...planning].sort((a, b) => startKey(a).localeCompare(startKey(b))),
        [planning]
    );

    const current = useMemo(() => {
        if (!now) return null;
        const started = sorted.filter(item => startKey(item) <= now);
        const candidate = started.length > 0 ? started[started.length - 1] : null;
        if (!candidate) return null;
        const end = endKey(candidate);
        if (end && end < now) return null;
        return candidate;
    }, [sorted, now]);

    const next = useMemo(() => {
        if (!now) return null;
        return sorted.find(item => startKey(item) > now) || null;
    }, [sorted, now]);

    const showTomorrowOverview = useMemo(() => {
        if (previewTomorrow) return true;
        if (!now) return false;
        return Number(now.slice(11, 13)) >= TOMORROW_OVERVIEW_HOUR;
    }, [now, previewTomorrow]);

    const tomorrowItems = useMemo(() => {
        if (previewTomorrow) {
            const firstDate = sorted[0]?.date;
            return firstDate ? sorted.filter(item => item.date === firstDate) : [];
        }
        if (!now) return [];
        const tomorrowDate = addDays(now.slice(0, 10), 1);
        return sorted.filter(item => item.date === tomorrowDate);
    }, [sorted, now, previewTomorrow]);

    const planningByDate = useMemo(() => {
        const map = new Map<string, IntroPlanningItem[]>();
        for (const item of sorted) {
            const list = map.get(item.date);
            if (list) list.push(item);
            else map.set(item.date, [item]);
        }
        return map;
    }, [sorted]);

    const planningDates = useMemo(() => Array.from(planningByDate.keys()), [planningByDate]);

    const { startHour, endHour } = useMemo(() => {
        if (sorted.length === 0) return { startHour: 8, endHour: 22 };
        let minStart = Infinity;
        let maxEnd = -Infinity;
        for (const item of sorted) {
            const start = toMinutes(item.time_start);
            const end = item.time_end ? toMinutes(item.time_end) : start + DEFAULT_DURATION_MINUTES;
            if (start < minStart) minStart = start;
            if (end > maxEnd) maxEnd = end;
        }
        return { startHour: Math.floor(minStart / 60), endHour: Math.ceil(maxEnd / 60) };
    }, [sorted]);

    const hours = useMemo(
        () => Array.from({ length: Math.max(endHour - startHour, 1) + 1 }, (_, i) => startHour + i),
        [startHour, endHour]
    );

    const totalHeight = Math.max(endHour - startHour, 1) * HOUR_HEIGHT;

    const selectedGridItem = useMemo(
        () => sorted.find(item => item.id === selectedGridItemId) || null,
        [sorted, selectedGridItemId]
    );

    const openFullPlanning = () => {
        const today = now.slice(0, 10);
        setSelectedDay(prev =>
            prev && planningDates.includes(prev) ? prev : (planningDates.find(d => d >= today) || planningDates[0] || null)
        );
        setSelectedGridItemId(null);
        setFullPlanningOpen(true);
    };

    const toggleExpanded = (id: number) => {
        setExpandedIds(prev => {
            const nextSet = new Set(prev);
            if (nextSet.has(id)) nextSet.delete(id);
            else nextSet.add(id);
            return nextSet;
        });
    };

    return (
        <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <ActivityCard label="Nu bezig" item={current} accent="live" icon={PartyPopper} />
                <ActivityCard label="Volgende activiteit" item={next} accent="next" icon={Calendar} />
            </SimpleGrid>

            {showTomorrowOverview && tomorrowItems.length > 0 && (
                <Card padding="lg" withBorder shadow="lg">
                    <Stack gap="md">
                        <Group gap="sm">
                            <ThemeIcon size="lg">
                                <Sunrise size={20} />
                            </ThemeIcon>
                            <Stack gap={2}>
                                <Title order={2} size="h3" c="brand">
                                    Planning voor morgen
                                </Title>
                                <Text size="sm" c="dimmed" fw={500} tt="capitalize">
                                    {formatDate(tomorrowItems[0].date, 'EEEE d MMMM')}
                                </Text>
                            </Stack>
                        </Group>

                        <Stack gap="xs">
                            {tomorrowItems.map(item => {
                                const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                                return (
                                    <Paper
                                        key={item.id}
                                        p="md"
                                        withBorder
                                        style={isCurrentOrNext ? {
                                            backgroundColor: 'var(--surface-subtle)',
                                            borderColor: 'color-mix(in srgb, var(--mantine-color-brand-filled) 35%, transparent)',
                                        } : undefined}
                                    >
                                        <Stack gap={4}>
                                            <Group gap={6} c={isCurrentOrNext ? 'brand' : 'dimmed'}>
                                                <Clock size={14} />
                                                <Text size="xs" fw={900} tt="uppercase">
                                                    {formatTimeRange(item)}
                                                </Text>
                                            </Group>
                                            <Text fw={700}>{item.title}</Text>
                                            {item.location && (
                                                <Group gap={4} c="dimmed">
                                                    <MapPin size={14} />
                                                    <Text size="xs" fw={600}>{item.location}</Text>
                                                </Group>
                                            )}
                                            {item.description && (
                                                <Text size="sm" c="dimmed">
                                                    <FormattedText text={item.description} />
                                                </Text>
                                            )}
                                        </Stack>
                                    </Paper>
                                );
                            })}
                        </Stack>
                    </Stack>
                </Card>
            )}

            <Card padding="lg" withBorder shadow="lg">
                <Stack gap="lg">
                    <Group justify="space-between" align="center" wrap="wrap" gap="md">
                        <Title order={2} size="h3" c="brand">
                            Volledige planning
                        </Title>
                        <Group gap="xs" wrap="wrap">
                            {planning.length > 0 && (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={openFullPlanning}
                                    leftSection={<CalendarDays size={16} />}
                                >
                                    Bekijk tijdlijn
                                </Button>
                            )}
                            <CalendarExportButton
                                feedPath="/api/intro/planning.ics"
                                calendarName="Salve Mundi Introductie"
                                label="Abonneer op agenda"
                            />
                        </Group>
                    </Group>

                    {planningImageUrl ? (
                        <UnstyledButton
                            type="button"
                            onClick={() => setLightboxOpen(true)}
                            onMouseEnter={() => setImageHovered(true)}
                            onMouseLeave={() => setImageHovered(false)}
                            style={{
                                position: 'relative',
                                display: 'block',
                                width: '100%',
                                overflow: 'hidden',
                                borderRadius: 'var(--mantine-radius-md)',
                                cursor: 'zoom-in',
                            }}
                        >
                            <Image
                                src={planningImageUrl}
                                alt="Planning introweek"
                                width={1600}
                                height={2000}
                                unoptimized
                                style={{ width: '100%', height: 'auto', display: 'block' }}
                            />
                            <Box
                                pos="absolute"
                                inset={0}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: imageHovered ? 'var(--overlay-scrim)' : 'transparent',
                                    transition: 'background-color 150ms ease',
                                }}
                            >
                                <Badge
                                    size="lg"
                                    color="darkBase"
                                    leftSection={<ZoomIn size={16} />}
                                    style={{
                                        opacity: imageHovered ? 1 : 0,
                                        transition: 'opacity 150ms ease',
                                    }}
                                >
                                    Bekijk fullscreen
                                </Badge>
                            </Box>
                        </UnstyledButton>
                    ) : (
                        <Paper p="xl" withBorder ta="center" style={{ borderStyle: 'dashed' }}>
                            <Stack align="center" gap="sm">
                                <Text span c="brand" lh={1}>
                                    <ImageOff size={32} />
                                </Text>
                                <Text size="lg" fw={700} c="dimmed">
                                    De planning wordt binnenkort bekendgemaakt
                                </Text>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </Card>

            <Modal
                opened={fullPlanningOpen}
                onClose={() => setFullPlanningOpen(false)}
                title="Volledige planning"
                size="90%"
                centered
                styles={{ body: { padding: 0 } }}
            >
                <Box hiddenFrom="sm">
                    {planningDates.length > 1 && (
                        <ScrollArea px="md" py="sm">
                            <Group gap="xs" wrap="nowrap">
                                {planningDates.map(date => {
                                    const isToday = date === now.slice(0, 10);
                                    const isSelected = date === selectedDay;
                                    return (
                                        <Button
                                            key={date}
                                            type="button"
                                            size="xs"
                                            variant={isSelected ? 'filled' : 'default'}
                                            onClick={() => setSelectedDay(date)}
                                            style={{ flexShrink: 0, textTransform: 'capitalize' }}
                                        >
                                            {formatDate(date, 'EEE d MMM')}
                                            {isToday && ' •'}
                                        </Button>
                                    );
                                })}
                            </Group>
                        </ScrollArea>
                    )}
                    <Divider />
                    <ScrollArea mah="65vh" p="md">
                        {selectedDay ? (
                            <Stack gap="sm">
                                <Text size="sm" fw={700} c="dimmed" tt="capitalize">
                                    {formatDate(selectedDay, 'EEEE d MMMM')}
                                </Text>
                                {(planningByDate.get(selectedDay) || []).map(item => {
                                    const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                                    const hasDescription = Boolean(item.description);
                                    const isExpanded = hasDescription && expandedIds.has(item.id);
                                    return (
                                        <Paper
                                            key={item.id}
                                            p="sm"
                                            withBorder
                                            style={isCurrentOrNext ? {
                                                backgroundColor: 'var(--surface-subtle)',
                                                borderColor: 'color-mix(in srgb, var(--mantine-color-brand-filled) 35%, transparent)',
                                            } : undefined}
                                        >
                                            <UnstyledButton
                                                type="button"
                                                w="100%"
                                                onClick={() => hasDescription && toggleExpanded(item.id)}
                                                aria-expanded={hasDescription ? isExpanded : undefined}
                                                style={{ cursor: hasDescription ? 'pointer' : 'default' }}
                                            >
                                                <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                                                    <Stack gap={4} style={{ minWidth: 0 }}>
                                                        <Group gap={6} c={isCurrentOrNext ? 'brand' : 'dimmed'}>
                                                            <Clock size={14} />
                                                            <Text size="xs" fw={900} tt="uppercase">
                                                                {formatTimeRange(item)}
                                                            </Text>
                                                        </Group>
                                                        <Text fw={700}>{item.title}</Text>
                                                        {item.location && (
                                                            <Group gap={4} c="dimmed">
                                                                <MapPin size={14} />
                                                                <Text size="xs" fw={600}>{item.location}</Text>
                                                            </Group>
                                                        )}
                                                    </Stack>
                                                    {hasDescription && (
                                                        <ChevronDown
                                                            size={16}
                                                            style={{
                                                                flexShrink: 0,
                                                                transform: isExpanded ? 'rotate(180deg)' : undefined,
                                                                transition: 'transform 150ms ease',
                                                            }}
                                                        />
                                                    )}
                                                </Group>
                                            </UnstyledButton>
                                            {item.description && (
                                                <Collapse expanded={isExpanded}>
                                                    <Text size="sm" c="dimmed" pt="xs">
                                                        <FormattedText text={item.description} />
                                                    </Text>
                                                </Collapse>
                                            )}
                                        </Paper>
                                    );
                                })}
                            </Stack>
                        ) : (
                            <Text ta="center" py="xl" size="sm" c="dimmed">
                                Geen planning beschikbaar.
                            </Text>
                        )}
                    </ScrollArea>
                </Box>

                <Box visibleFrom="sm">
                    <ScrollArea mah="70vh">
                        {planningDates.length > 0 ? (
                            <Box>
                                <Box
                                    pos="sticky"
                                    top={0}
                                    style={{
                                        zIndex: 10,
                                        display: 'flex',
                                        borderBottom: '1px solid var(--mantine-color-default-border)',
                                        backgroundColor: 'var(--mantine-color-default)',
                                    }}
                                >
                                    <Box w={56} style={{ flexShrink: 0 }} />
                                    {planningDates.map(date => {
                                        const isToday = date === now.slice(0, 10);
                                        return (
                                            <Box
                                                key={date}
                                                miw={144}
                                                px="xs"
                                                py="xs"
                                                ta="center"
                                                style={{
                                                    flex: 1,
                                                    borderLeft: '1px solid var(--surface-subtle)',
                                                }}
                                            >
                                                <Text size="xs" fw={900} tt="uppercase" c={isToday ? 'brand' : 'dimmed'}>
                                                    {formatDate(date, 'EEE')}
                                                </Text>
                                                <Text size="sm" fw={900} tt="capitalize" c={isToday ? 'brand' : undefined}>
                                                    {formatDate(date, 'd MMM')}
                                                </Text>
                                            </Box>
                                        );
                                    })}
                                </Box>

                                <Box p="md" style={{ display: 'flex' }}>
                                    <Box pos="relative" w={56} h={totalHeight} style={{ flexShrink: 0 }}>
                                        {hours.map(hour => (
                                            <Text
                                                key={hour}
                                                size="xs"
                                                fw={600}
                                                c="dimmed"
                                                pos="absolute"
                                                right={8}
                                                style={{
                                                    top: (hour - startHour) * HOUR_HEIGHT,
                                                    transform: 'translateY(-50%)',
                                                }}
                                            >
                                                {String(hour).padStart(2, '0')}:00
                                            </Text>
                                        ))}
                                    </Box>

                                    {planningDates.map(date => {
                                        const dayLayout = layoutDay(planningByDate.get(date) || [], startHour);
                                        return (
                                            <Box
                                                key={date}
                                                pos="relative"
                                                miw={144}
                                                h={totalHeight}
                                                px={4}
                                                style={{
                                                    flex: 1,
                                                    borderLeft: '1px solid var(--surface-subtle)',
                                                }}
                                            >
                                                {hours.map(hour => (
                                                    <Box
                                                        key={hour}
                                                        pos="absolute"
                                                        left={0}
                                                        right={0}
                                                        style={{
                                                            top: (hour - startHour) * HOUR_HEIGHT,
                                                            borderTop: '1px solid var(--surface-subtle)',
                                                        }}
                                                    />
                                                ))}
                                                {dayLayout.map(({ item, top, height, col, cols }) => {
                                                    const isCurrentOrNext = current?.id === item.id || next?.id === item.id;
                                                    const isSelected = selectedGridItemId === item.id;
                                                    return (
                                                        <UnstyledButton
                                                            key={item.id}
                                                            type="button"
                                                            onClick={() => setSelectedGridItemId(prev => (prev === item.id ? null : item.id))}
                                                            title={`${formatTimeRange(item)} — ${item.title}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: top + 2,
                                                                height: Math.max(height - 4, 24),
                                                                left: `${(col / cols) * 100}%`,
                                                                width: `calc(${100 / cols}% - 3px)`,
                                                                overflow: 'hidden',
                                                                borderRadius: 'var(--mantine-radius-sm)',
                                                                padding: '4px 6px',
                                                                textAlign: 'left',
                                                                zIndex: isSelected ? 10 : 1,
                                                                backgroundColor: isCurrentOrNext ? 'var(--mantine-color-brand-filled)' : 'var(--mantine-color-default)',
                                                                color: isCurrentOrNext ? 'var(--mantine-color-white)' : 'var(--mantine-color-text)',
                                                                border: '1px solid var(--surface-subtle-border)',
                                                                borderLeft: `4px solid ${isCurrentOrNext ? 'var(--mantine-color-white)' : 'var(--mantine-color-brand-filled)'}`,
                                                                boxShadow: isSelected ? '0 0 0 2px var(--mantine-color-accent-filled)' : 'var(--mantine-shadow-xs)',
                                                            }}
                                                        >
                                                            <Text size="xs" fw={900} lh={1.2} c={isCurrentOrNext ? 'white' : 'brand'}>
                                                                {item.time_start.slice(0, 5)}
                                                            </Text>
                                                            <Text size="xs" fw={700} lh={1.25} lineClamp={2}>
                                                                {item.title}
                                                            </Text>
                                                        </UnstyledButton>
                                                    );
                                                })}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        ) : (
                            <Text ta="center" py="xl" size="sm" c="dimmed">
                                Geen planning beschikbaar.
                            </Text>
                        )}
                    </ScrollArea>

                    {selectedGridItem && (
                        <>
                            <Divider />
                            <Group justify="space-between" align="flex-start" p="md" wrap="nowrap">
                                <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                                    <Group gap={6} c="brand">
                                        <Clock size={14} />
                                        <Text size="xs" fw={900} tt="uppercase">
                                            {formatTimeRange(selectedGridItem)}
                                        </Text>
                                    </Group>
                                    <Title order={4} size="h4">
                                        {selectedGridItem.title}
                                    </Title>
                                    {selectedGridItem.location && (
                                        <Group gap={4} c="dimmed">
                                            <MapPin size={14} />
                                            <Text size="xs" fw={600}>{selectedGridItem.location}</Text>
                                        </Group>
                                    )}
                                    {selectedGridItem.description && (
                                        <Text size="sm" c="dimmed">
                                            <FormattedText text={selectedGridItem.description} />
                                        </Text>
                                    )}
                                </Stack>
                                <ActionIcon
                                    type="button"
                                    size="md"
                                    onClick={() => setSelectedGridItemId(null)}
                                    aria-label="Sluiten"
                                >
                                    <X size={16} />
                                </ActionIcon>
                            </Group>
                        </>
                    )}
                </Box>
            </Modal>

            <Modal
                opened={lightboxOpen && Boolean(planningImageUrl)}
                onClose={() => setLightboxOpen(false)}
                size="90%"
                centered
                padding="xs"
                aria-label="Planning introweek fullscreen"
            >
                {planningImageUrl && (
                    <Box pos="relative" h="80vh" w="100%">
                        <Image
                            src={planningImageUrl}
                            alt="Planning introweek"
                            fill
                            unoptimized
                            style={{ objectFit: 'contain' }}
                        />
                    </Box>
                )}
            </Modal>
        </Stack>
    );
}
