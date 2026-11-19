'use client';

import { useState, Fragment } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import {
    Search,
    ChevronDown,
    Edit,
    Trash,
    UserCheck,
    Heart,
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
    Paper,
    SimpleGrid,
    Stack,
    Table,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { ActionButton, EmptyState } from './IntroTabComponents';
import { type IntroParentSignup as IntroParentRow } from '@salvemundi/validations/schema/intro.zod';
import { formatDate } from '@/shared/lib/utils/date';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';

interface Props {
    parents: IntroParentRow[];
    onDelete: (id: number) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroParentRow>) => Promise<void>;
    onExport: () => void;
    deletingId: number | null;
}

export default function IntroParentsTab({ parents, onDelete, onUpdate, deletingId }: Props) {
    const [search, setSearch] = useState('');
    const [expandedRows, setExpandedRows] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editData, setEditData] = useState<Partial<IntroParentRow>>({});

    const filtered = parents.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase().includes(q) ||
            (p.email || '').toLowerCase().includes(q) || (p.phone_number || '').includes(q);
    });

    const toggleExpand = (id: number) => {
        setExpandedRows(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
    };

    const startEdit = (e: MouseEvent, p: IntroParentRow) => {
        e.stopPropagation();
        setEditingId(p.id);
        setEditData({
            ...p,
            phone_number: formatPhoneNumber(p.phone_number)
        });
        if (!expandedRows.includes(p.id)) setExpandedRows(prev => [...prev, p.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, editData);
        setEditingId(null);
    };

    return (
        <Stack gap="lg">
            <TextInput
                placeholder="Zoek op naam, email of telefoon..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                leftSection={<Search size={16} />}
            />

            {filtered.length === 0 ? (
                <EmptyState icon={Heart} text="Nog geen ouder-aanmeldingen binnengekomen" />
            ) : (
                <Card withBorder padding={0} radius="lg" style={{ overflow: 'hidden' }}>
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
                                {filtered.map(p => {
                                    const isExpanded = expandedRows.includes(p.id);
                                    return (
                                        <Fragment key={p.id}>
                                            <Table.Tr
                                                onClick={() => toggleExpand(p.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <Table.Td>
                                                    <Box
                                                        style={{
                                                            width: 10,
                                                            height: 10,
                                                            borderRadius: '50%',
                                                            backgroundColor: p.approved
                                                                ? 'var(--mantine-color-success-filled)'
                                                                : 'var(--mantine-color-dimmed)',
                                                            opacity: p.approved ? 1 : 0.35,
                                                        }}
                                                    />
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap="xs" wrap="wrap">
                                                        <Text size="sm" fw={600}>
                                                            {p.first_name || 'N/A'} {p.last_name || ''}
                                                        </Text>
                                                        {p.approved && (
                                                            <Badge color="success" variant="light" size="xs">
                                                                Goedgekeurd
                                                            </Badge>
                                                        )}
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td visibleFrom="sm">
                                                    <Text size="xs" c="dimmed">{p.email || '-'}</Text>
                                                </Table.Td>
                                                <Table.Td visibleFrom="md">
                                                    <Text size="xs" c="dimmed">
                                                        {formatPhoneNumber(p.phone_number) || '-'}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td ta="right">
                                                    <Group justify="flex-end" gap="xs" wrap="nowrap">
                                                        <ActionButton
                                                            icon={Edit}
                                                            onClick={(e) => startEdit(e, p)}
                                                            title="Bewerken"
                                                        />
                                                        <ActionButton
                                                            icon={Trash}
                                                            onClick={(e) => { e.stopPropagation(); void onDelete(p.id); }}
                                                            variant="danger"
                                                            disabled={deletingId === p.id}
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
                                                                {editingId === p.id ? (
                                                                    <Stack gap="md">
                                                                        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                                                            <Text size="xs" fw={600} c="accent">Ouder Bewerken</Text>
                                                                            <Group gap="xs">
                                                                                <Button
                                                                                    type="button"
                                                                                    color="success"
                                                                                    size="xs"
                                                                                    onClick={() => { void handleSaveEdit(p.id); }}
                                                                                    leftSection={<Save size={14} />}
                                                                                >
                                                                                    Opslaan
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="subtle"
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
                                                                            <Textarea
                                                                                label="Motivatie"
                                                                                size="xs"
                                                                                rows={3}
                                                                                value={editData.motivation || ''}
                                                                                onChange={(e) => setEditData({ ...editData, motivation: e.currentTarget.value })}
                                                                                style={{ gridColumn: '1 / -1' }}
                                                                            />
                                                                        </SimpleGrid>
                                                                    </Stack>
                                                                ) : (
                                                                    <Stack gap="md">
                                                                        <Group justify="space-between" align="center">
                                                                            <Text size="xs" fw={600} c="accent">Extra Informatie</Text>
                                                                            <Button
                                                                                type="button"
                                                                                variant="subtle"
                                                                                size="xs"
                                                                                onClick={() => startEdit({ stopPropagation: () => { } } as MouseEvent, p)}
                                                                                leftSection={<Edit size={14} />}
                                                                            >
                                                                                Bewerken
                                                                            </Button>
                                                                        </Group>
                                                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                                                                            <Stack gap={2}>
                                                                                <Text size="xs" c="dimmed">Aangemeld op</Text>
                                                                                <Text size="sm" fw={600}>
                                                                                    {p.created_at ? formatDate(p.created_at) : '-'}
                                                                                </Text>
                                                                            </Stack>
                                                                            <Stack gap={2}>
                                                                                <Text size="xs" c="dimmed">Status</Text>
                                                                                <Text size="sm" fw={600}>
                                                                                    {p.status === 'approved' ? 'Goedgekeurd' : 'Geregistreerd'}
                                                                                </Text>
                                                                            </Stack>
                                                                        </SimpleGrid>
                                                                        {p.motivation && (
                                                                            <Stack gap="xs">
                                                                                <Text size="xs" fw={600} c="accent">Motivatie</Text>
                                                                                <Paper withBorder p="md" radius="md">
                                                                                    <Text size="sm" fs="italic">
                                                                                        &quot;{p.motivation}&quot;
                                                                                    </Text>
                                                                                </Paper>
                                                                            </Stack>
                                                                        )}
                                                                    </Stack>
                                                                )}
                                                            </Grid.Col>
                                                            <Grid.Col span={{ base: 12, lg: 4 }}>
                                                                <Divider hiddenFrom="lg" mb="md" />
                                                                <Stack gap="sm">
                                                                    <Text size="xs" fw={600} c="accent">Beheer Acties</Text>
                                                                    <Button
                                                                        type="button"
                                                                        variant={p.approved ? 'light' : 'default'}
                                                                        color={p.approved ? 'success' : undefined}
                                                                        fullWidth
                                                                        leftSection={<UserCheck size={16} />}
                                                                        onClick={() => {
                                                                            void onUpdate(p.id, {
                                                                                approved: !p.approved,
                                                                                status: !p.approved ? 'approved' : 'registered'
                                                                            });
                                                                        }}
                                                                    >
                                                                        {p.approved ? 'Goedgekeurd' : 'Keur Goed'}
                                                                    </Button>
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
