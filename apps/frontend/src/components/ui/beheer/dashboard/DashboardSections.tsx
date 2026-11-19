import React from 'react';
import {
    Calendar,
    FileText,
    Users,
    Ticket,
    Shield,
    MapPin,
    UserCheck,
    Cake,
    Award,
    Activity,
    Globe,
    Zap,
    ShoppingBag,
    Briefcase,
    FileSignature,
    Wine,
    Camera,
} from 'lucide-react';
import { Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { ActionCard } from './BeheerCards';
import { formatDate } from '@/shared/lib/utils/date';
import {
    type DashboardStats,
    type Birthday,
    type RecentActivity,
    type TopSticker,
} from '@salvemundi/validations/schema/beheer-dashboard.zod';

function SectionHeader({ title, order = 2 }: { title: string; order?: 2 | 3 }) {
    return (
        <Group gap="sm">
            <Title order={order} size="h5" c="brand">
                {title}
            </Title>
            <Divider style={{ flex: 1 }} />
        </Group>
    );
}

interface DashboardItem {
    title: string;
    value?: string | number;
    icon: React.ReactNode;
    href: string;
    disabled?: boolean;
    subtitle?: string;
}

export function DashboardHub({
    permissions,
    stats,
}: {
    permissions: string[];
    stats: DashboardStats;
}) {
    const groups: { title: string; items: DashboardItem[] }[] = [
        {
            title: 'Commissies',
            items: [
                { title: 'Activiteiten', value: stats.upcomingEventsCount, icon: <Calendar />, href: '/beheer/activiteiten', disabled: !permissions.includes('activiteiten') },
                { title: 'Intro', value: stats.introSignups, icon: <FileText />, href: '/beheer/intro', disabled: !permissions.includes('intro') },
                { title: 'Reis', value: stats.reisSignups, icon: <Globe />, href: '/beheer/reis', disabled: !permissions.includes('reis') },
                { title: 'Kroegentocht', value: stats.pubCrawlSignups, icon: <Ticket />, href: '/beheer/kroegentocht', disabled: !permissions.includes('kroegentocht') },
                { title: 'Camera', value: 'Beheer', icon: <Camera />, href: '/beheer/camera', disabled: !permissions.includes('camera') },
                { title: 'CoBo', value: 'Beheer', icon: <Wine />, href: '/beheer/cobo', disabled: !permissions.includes('cobo') },
            ].filter((i) => !i.disabled),
        },
        {
            title: 'Bestuur',
            items: [
                { title: 'Leden', value: stats.totalMembers, icon: <Users />, href: '/beheer/leden', disabled: !permissions.includes('leden') },
                { title: 'Commissies', value: 'Beheer', icon: <Shield />, href: '/beheer/commissies', disabled: !permissions.includes('commissies') },
                { title: 'Stickers', value: 'Beheer', icon: <MapPin />, href: '/beheer/stickers', disabled: !permissions.includes('stickers') },
                { title: 'Coupons', value: stats.totalCoupons, icon: <Ticket />, href: '/beheer/coupons', disabled: !permissions.includes('coupons') },
                { title: 'Webshop', value: 'Beheer', icon: <ShoppingBag />, href: '/beheer/webshop', disabled: !permissions.includes('webshop') },
                { title: 'Bijbanenbank', value: 'Beheer', icon: <Briefcase />, href: '/beheer/bijbanenbank', disabled: !permissions.includes('vacatures') },
                { title: "NDA's", value: 'Beheer', icon: <FileSignature />, href: '/beheer/nda', disabled: !permissions.includes('nda') },
            ].filter((i) => !i.disabled),
        },
        {
            title: 'ICT-Commissie',
            items: [
                { title: 'Azure Sync', value: 'Beheer', icon: <Zap />, href: '/beheer/sync', disabled: !permissions.includes('sync') },
                { title: 'Systeem Status', icon: <Activity />, href: '/beheer/services', disabled: !permissions.includes('services') },
                { title: 'Logboek', value: 'Bekijken', icon: <FileText />, href: '/beheer/logging', disabled: !permissions.includes('logging') },
                { title: 'Test Modus', value: 'Start', icon: <UserCheck />, href: '/beheer/impersonate', disabled: !permissions.includes('impersonate') },
            ].filter((i) => !i.disabled),
        },
    ].filter((group) => group.items.length > 0);

    return (
        <Stack gap="xl">
            {groups.length > 0 ? (
                groups.map((group) => (
                    <Stack key={group.title} gap="md">
                        <SectionHeader title={group.title} order={2} />
                        <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="md"
                        >
                            {group.items.map((item) => (
                                <ActionCard
                                    key={item.href}
                                    title={item.title}
                                    subtitle={item.subtitle}
                                    value={item.value !== 'Beheer' && item.value !== 'Bekijken' && item.value !== 'Start' ? item.value : undefined}
                                    icon={item.icon}
                                    href={item.href}
                                />
                            ))}
                        </SimpleGrid>
                    </Stack>
                ))
            ) : (
                <Paper withBorder p="lg" radius="lg" ta="center" maw={440} mx="auto" my="md">
                    <Text size="sm" fw={500} c="dimmed">
                        Er zijn nog geen beheerpagina&apos;s voor de commissies waar je in zit.
                    </Text>
                </Paper>
            )}
        </Stack>
    );
}

export function BirthdaysList({ data }: { data: Birthday[] }) {
    if (data.length === 0) return null;
    return (
        <Stack gap="sm">
            <SectionHeader title="Aankomende Jarigen" order={3} />
            <Stack gap="xs">
                {data.map((person) => (
                    <ActionCard
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}`}
                        subtitle={person.isToday ? 'Vandaag jarig!' : formatDate(person.birthday, 'd MMMM')}
                        color={person.isToday ? 'accent' : 'brand'}
                        pulse={person.isToday}
                        icon={<Cake />}
                    />
                ))}
            </Stack>
        </Stack>
    );
}

export function TopStickersList({ data }: { data: TopSticker[] }) {
    if (data.length === 0) return null;
    return (
        <Stack gap="sm">
            <SectionHeader title="Top Sticker Verzamelaars" order={3} />
            <Stack gap="xs">
                {data.map((person, i) => (
                    <ActionCard
                        key={person.id}
                        title={`${person.first_name} ${person.last_name}`}
                        value={person.count}
                        color={i === 0 ? 'accent' : 'brand'}
                        icon={<Award />}
                    />
                ))}
            </Stack>
        </Stack>
    );
}

export function ActivitySignupsList({ data }: { data: RecentActivity[] }) {
    if (data.length === 0) return null;
    return (
        <Stack gap="sm">
            <SectionHeader title="Activiteiten aanmeldingen" order={3} />
            <Stack gap="xs">
                {data.map((ev) => (
                    <ActionCard
                        key={ev.id}
                        title={ev.name}
                        subtitle={ev.event_date ? formatDate(ev.event_date, 'd MMMM yyyy') : undefined}
                        value={ev.signups}
                        href={`/beheer/activiteiten/${ev.id}/aanmeldingen`}
                    />
                ))}
            </Stack>
        </Stack>
    );
}
