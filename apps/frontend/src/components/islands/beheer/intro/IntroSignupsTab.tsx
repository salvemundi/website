'use client';

import { useState, Fragment } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import {
    Search,
    Mail,
    ChevronDown,
    Edit,
    Trash,
    UserCheck,
    Eye,
    Users,
    Save,
    X
} from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Grid,
    Group,
    SimpleGrid,
    Stack,
    Table,
    Text,
    TextInput,
} from '@mantine/core';
import { ActionButton, EmptyState } from './IntroTabComponents';
import { type IntroSignup as IntroSignupRow } from '@salvemundi/validations/schema/intro.zod';
import { formatDate } from '@/shared/lib/utils/date';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface Props {
    signups: IntroSignupRow[];
    onDelete: (id: number) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroSignupRow>) => Promise<void>;
    onExport: () => void;
    deletingId: number | null;
}

export default function IntroSignupsTab({ signups, onDelete, onUpdate, deletingId }: Props) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<IntroSignupRow>>({});

    const filtered = signups.filter(s => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${s.first_name || ''} ${s.last_name || ''}`.toLowerCase().includes(q) ||
            (s.email || '').toLowerCase().includes(q) || (s.phone_number || '').includes(q);
    });

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
    };

    const startEdit = (e: MouseEvent, s: IntroSignupRow) => {
        e.stopPropagation();
        setEditingId(s.id);
        setEditData({
            ...s,
            phone_number: formatPhoneNumber(s.phone_number)
        });
        if (!expandedRows.includes(s.id)) setExpandedRows(prev => [...prev, s.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, editData);
        setEditingId(null);
    };

    const handleMailBcc = () => {
        const emails = signups.map(s => s.email).filter(Boolean).join(',');
        window.location.href = `mailto:?bcc=${emails}&subject=Intro${encodeURIComponent(' Aanmeldingen')}`;
    };

    return (
        <Stack gap="lg">
            <Group gap="sm" wrap="wrap">
                <TextInput
                    placeholder="Zoek op naam, email of telefoon..."
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    leftSection={<Search size={16} />}
                    style={{ flex: 1, minWidth: 240 }}
                />
                <Button
                    type="button"
                    onClick={handleMailBcc}
                    leftSection={<Mail size={16} />}
                >
                    Mail BCC
                </Button>
            </Group>

            {filtered.length === 0 ? (
                <EmptyState icon={Users} text="Nog geen aanmeldingen binnengekomen" />
            ) : (
                <Card withBorder padding={0} style={{ overflow: 'hidden' }}>
                    <Table.ScrollContainer minWidth={600}>
                        <Table highlightOnHover verticalSpacing="md" horizontalSpacing="lg">
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th w={80}>Status</Table.Th>
                                    <Table.Th>Naam</Table.Th>
                                    <Table.Th visibleFrom="sm">Email</Table.Th>
                                    <Table.Th visibleFrom="md" w={180}>Telefoon</Table.Th>
                                    <Table.Th ta="right" w={160}>Acties</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {filtered.map(s => {
                                    const isExpanded = expandedRows.includes(s.id);
                                    return (
                                        <Fragment key={s.id}>
                                            <Table.Tr
                                                onClick={() => toggleExpand(s.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Table.Td>
                                                    <Box
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            backgroundColor: s.approved
                                                                ? 'var(--mantine-color-success-filled)'
                                                                : 'var(--mantine-color-dimmed)',
                                                            opacity: s.approved ? 1 : 0.35,
                                                        }}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" wrap="wrap">
                                                        <Text size="sm" fw={600}>
                                                            {s.first_name} {s.last_name}
                                                        </Text>
                                                        {s.approved && (
                                                            <Badge color="success" size="xs">
                                                                Goedgekeurd
                                                            </Badge>
                                                        )}
                                                        {s.status === 'approved' && !s.approved && (
                                                            <Badge size="xs">
                                                                Lid
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td visibleFrom="sm">
                                                    <Text size="xs" c="dimmed">{s.email || '-'}</Text>
                                                </Table.Td>
                                                <Table.Td visibleFrom="md">
                                                    <Text size="xs" c="dimmed">
                                                        {formatPhoneNumber(s.phone_number) || '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group justify="flex-end" gap="xs" wrap="nowrap">
                                                        <ActionButton
                                                            icon={Edit}
                                                            onClick={(e) => startEdit(e, s)}
                                                            title="Bewerken"
                                                        />
                                                        <ActionButton
                                                            icon={Trash}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                void onDelete(s.id);
                                                            }}
                                                            variant="danger"
                                                            disabled={deletingId === s.id}
                                                            title="Verwijderen"
                                                        />
                                                        <ChevronDown
                                                            size={16}
                                                            style={{
                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 200ms ease',
                                                            }}
                                                        />
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>

                                            {isExpanded && (
                                                <Table.Tr>
                                                    <Table.Td colSpan={5} p="xl">
                                                        <Grid gap="xl">
                                                            <Grid.Col span={{ base: 12, lg: 8 }}>
                                                                {editingId === s.id ? (
                                                                    <Stack gap="md">
                                                                        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                                                            <Text size="xs" fw={600} c="accent">Deelnemer Bewerken</Text>
                                                                            <Group gap="xs">
                                                                                <Button
                                                                                    type="button"
                                                                                    color="success"
                                                                                    size="xs"
                                                                                    onClick={() => { void handleSaveEdit(s.id); }}
                                                                                    leftSection={<Save size={14} />}
                                                                                >
                                                                                    Opslaan
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    size="xs"
                                                                                    onClick={() => setEditingId(null)}
                                                                                    leftSection={<X size={14} />}
                                                                                >
                                                                                    Annuleren
                                                                                </Button>
                                                                            </Group>
                                                                        </Group>
                                                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                                                            <TextInput
                                                                                label="Voornaam"
                                                                                size="xs"
                                                                                value={editData.first_name || ''}
                                                                                onChange={(e) => setEditData({ ...editData, first_name: e.currentTarget.value })}
                                                                            />
                                                                            <TextInput
                                                                                label="Achternaam"
                                                                                size="xs"
                                                                                value={editData.last_name || ''}
                                                                                onChange={(e) => setEditData({ ...editData, last_name: e.currentTarget.value })}
                                                                            />
                                                                            <TextInput
                                                                                label="Email"
                                                                                type="email"
                                                                                size="xs"
                                                                                value={editData.email || ''}
                                                                                onChange={(e) => setEditData({ ...editData, email: e.currentTarget.value })}
                                                                            />
                                                                            <Stack gap={4}>
                                                                                <Text size="xs" fw={500}>Telefoon</Text>
                                                                                <PhoneInput
                                                                                    value={editData.phone_number || ''}
                                                                                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEditData({ ...editData, phone_number: e.target.value })}
                                                                                />
                                                                            </Stack>
                                                                        </SimpleGrid>
                                                                    </Stack>
                                                                ) : (
                                                                    <Stack gap="md">
                                                                        <Group justify="space-between" align="center">
                                                                            <Text size="xs" fw={600} c="accent">Extra Informatie</Text>
                                                                            <Button
                                                                                type="button"
                                                                                size="xs"
                                                                                onClick={() => startEdit({ stopPropagation: () => { } } as MouseEvent, s)}
                                                                                leftSection={<Edit size={14} />}
                                                                            >
                                                                                Bewerken
                                                                            </Button>
                                                                        </Group>
                                                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                                                            {s.date_of_birth && (
                                                                                <Stack gap={2}>
                                                                                    <Text size="xs" c="dimmed">Geboortedatum</Text>
                                                                                    <Text size="sm" fw={600}>{formatDate(s.date_of_birth)}</Text>
                                                                                </Stack>
                                                                            )}
                                                                            <Stack gap={2}>
                                                                                <Text size="xs" c="dimmed">Aangemeld op</Text>
                                                                                <Text size="sm" fw={600}>
                                                                                    {s.created_at ? formatDate(s.created_at) : '-'}
                                                                                </Text>
                                                                            </Stack>
                                                                            <Stack gap={2}>
                                                                                <Text size="xs" c="dimmed">Status</Text>
                                                                                <Text size="sm" fw={600}>
                                                                                    {s.status === 'approved' ? 'Goedgekeurd' : 'Geregistreerd'}
                                                                                </Text>
                                                                            </Stack>
                                                                        </SimpleGrid>
                                                                    </Stack>
                                                                )}
                                                            </Grid.Col>
                                                            <Grid.Col span={{ base: 12, lg: 4 }}>
                                                                <Divider hiddenFrom="lg" mb="md" />
                                                                <Stack gap="sm">
                                                                    <Text size="xs" fw={600} c="accent">Beheer Acties</Text>
                                                                    <Button
                                                                        type="button"
                                                                        variant={s.approved ? 'light' : 'default'}
                                                                        color={s.approved ? 'success' : undefined}
                                                                        fullWidth
                                                                        leftSection={<UserCheck size={16} />}
                                                                        onClick={() => {
                                                                            void onUpdate(s.id, {
                                                                                approved: !s.approved,
                                                                                status: !s.approved ? 'approved' : 'registered'
                                                                            });
                                                                        }}
                                                                    >
                                                                        {s.approved ? 'Goedgekeurd' : 'Keur Goed'}
                                                                    </Button>

                                                                    {s.favorite_gif && (
                                                                        <Button
                                                                            type="button"
                                                                            fullWidth
                                                                            leftSection={<Eye size={16} />}
                                                                            onClick={() => {
                                                                                if (s.favorite_gif) {
                                                                                    window.open(s.favorite_gif, '_blank');
                                                                                }
                                                                            }}
                                                                        >
                                                                            Bekijk GIF
                                                                        </Button>
                                                                    )}
                                                                </Stack>
                                                            </Grid.Col>
                                                        </Grid>
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </Table.Tbody>
                        </Table>
                    </Table.ScrollContainer>
                </Card>
            )}
        </Stack>
    );
}
