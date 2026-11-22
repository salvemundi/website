'use client';

import { useState } from 'react';
import { Plus, X, Save, Edit, Trash, ChevronDown, Users2, UserPlus, ClipboardCheck, User } from 'lucide-react';
import Link from 'next/link';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Collapse,
    Divider,
    Group,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Title,
    UnstyledButton,
} from '@mantine/core';
import { ActionButton, EmptyState } from './IntroTabComponents';
import type { IntroGroupWithDetails, IntroGroup } from '@salvemundi/validations/schema/intro.zod';

interface ApprovedOuder {
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
}

interface Props {
    groups: IntroGroupWithDetails[];
    approvedOuders: ApprovedOuder[];
    onCreate: (data: Partial<IntroGroup>) => Promise<void>;
    onUpdate: (id: number, data: Partial<IntroGroup>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
    onAddLeader: (groupId: number, userId: string) => Promise<void>;
    onRemoveLeader: (groupId: number, userId: string) => Promise<void>;
    saving: boolean;
    deletingId: number | null;
}

export default function IntroGroupsTab({ groups, approvedOuders, onCreate, onUpdate, onDelete, onAddLeader, onRemoveLeader, saving, deletingId }: Props) {
    const [creating, setCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newNotes, setNewNotes] = useState('');

    const [expandedIds, setExpandedIds] = useState<number[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editNotes, setEditNotes] = useState('');
    const [pickerGroupId, setPickerGroupId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
        setEditingId(null);
        setPickerGroupId(null);
    };

    const startEdit = (group: IntroGroupWithDetails) => {
        setEditingId(group.id);
        setEditName(group.name);
        setEditNotes(group.notes || '');
        if (!expandedIds.includes(group.id)) setExpandedIds(prev => [...prev, group.id]);
    };

    const handleSaveEdit = async (id: number) => {
        await onUpdate(id, { name: editName, notes: editNotes || null });
        setEditingId(null);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        await onCreate({ name: newName.trim(), notes: newNotes || null });
        setNewName('');
        setNewNotes('');
        setCreating(false);
    };

    const allLeaderIds = new Set(groups.flatMap(g => g.leaders.map(l => l.user_id)));
    const availableOuders = () => approvedOuders.filter(o => !allLeaderIds.has(o.user_id));

    return (
        <Stack gap="lg">
            {!creating && (
                <Group>
                    <Button
                        type="button"
                        onClick={() => setCreating(true)}
                        leftSection={<Plus size={16} />}
                    >
                        Nieuw Groepje
                    </Button>
                </Group>
            )}

            {creating && (
                <Card withBorder padding="xl">
                    <Stack gap="lg">
                        <Group justify="space-between" align="center">
                            <Title order={3} size="xs" c="dimmed" fw={700} tt="uppercase">
                                Nieuw Groepje
                            </Title>
                            <ActionIcon type="button" onClick={() => setCreating(false)} aria-label="Sluiten">
                                <X size={18} />
                            </ActionIcon>
                        </Group>
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                            <TextInput
                                label="Naam"
                                required
                                value={newName}
                                onChange={(e) => setNewName(e.currentTarget.value)}
                                placeholder="Bv. Groepje 1"
                            />
                            <TextInput
                                label="Notities"
                                value={newNotes}
                                onChange={(e) => setNewNotes(e.currentTarget.value)}
                                placeholder="Optioneel"
                            />
                        </SimpleGrid>
                        <Divider />
                        <Group gap="sm">
                            <Button
                                type="button"
                                onClick={() => { void handleCreate(); }}
                                loading={saving}
                                disabled={!newName.trim()}
                                leftSection={<Save size={16} />}
                            >
                                Opslaan
                            </Button>
                            <Button
                                type="button"
                                onClick={() => setCreating(false)}
                                leftSection={<X size={16} />}
                            >
                                Annuleren
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            )}

            {groups.length === 0 ? (
                <EmptyState icon={Users2} text="Nog geen groepjes aangemaakt" />
            ) : (
                <Stack gap="md">
                    {groups.map(group => {
                        const isExpanded = expandedIds.includes(group.id);
                        return (
                            <Card key={group.id} withBorder padding={0} style={{ overflow: 'hidden' }}>
                                <Group justify="space-between" align="center" px="lg" py="md" wrap="nowrap" gap="sm">
                                    <UnstyledButton
                                        type="button"
                                        onClick={() => toggleExpand(group.id)}
                                        style={{ flex: 1, minWidth: 0, textAlign: 'left' }}
                                    >
                                        <Stack gap={4}>
                                            <Text size="sm" fw={600} truncate>{group.name}</Text>
                                            <Group gap="md" wrap="wrap">
                                                <Group gap={4}>
                                                    <User size={12} />
                                                    <Text size="xs" c="dimmed">
                                                        {group.member_count} {group.member_count === 1 ? 'lid' : 'leden'}
                                                    </Text>
                                                </Group>
                                                <Text size="xs" c="dimmed">
                                                    {group.leaders.length === 0
                                                        ? 'Geen ouders'
                                                        : group.leaders.map(l => `${l.first_name} ${l.last_name}`.trim()).join(', ')}
                                                </Text>
                                            </Group>
                                        </Stack>
                                    </UnstyledButton>

                                    <Group gap="xs" wrap="nowrap">
                                        <ActionButton
                                            icon={Edit}
                                            onClick={(e) => { e.stopPropagation(); startEdit(group); }}
                                            title="Bewerken"
                                        />
                                        <ActionButton
                                            icon={Trash}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`Groepje "${group.name}" verwijderen? Dit verwijdert ook alle leden en aanwezigheid.`)) {
                                                    void onDelete(group.id);
                                                }
                                            }}
                                            variant="danger"
                                            disabled={deletingId === group.id}
                                            title="Verwijderen"
                                        />
                                        <ActionIcon
                                            type="button"
                                            onClick={() => toggleExpand(group.id)}
                                            aria-label={isExpanded ? 'Inklappen' : 'Uitklappen'}
                                        >
                                            <ChevronDown
                                                size={16}
                                                style={{
                                                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 200ms ease',
                                                }}
                                            />
                                        </ActionIcon>
                                    </Group>
                                </Group>

                                <Collapse expanded={isExpanded}>
                                    <Divider />
                                    <Box p="lg">
                                        <Stack gap="md">
                                            {editingId === group.id ? (
                                                <Stack gap="md">
                                                    <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                                        <Text size="xs" fw={600} c="accent">Groepje Bewerken</Text>
                                                        <Group gap="xs">
                                                            <Button
                                                                type="button"
                                                                color="success"
                                                                size="xs"
                                                                onClick={() => { void handleSaveEdit(group.id); }}
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
                                                            label="Naam"
                                                            size="xs"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.currentTarget.value)}
                                                        />
                                                        <TextInput
                                                            label="Notities"
                                                            size="xs"
                                                            value={editNotes}
                                                            onChange={(e) => setEditNotes(e.currentTarget.value)}
                                                        />
                                                    </SimpleGrid>
                                                </Stack>
                                            ) : (
                                                <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                                                    <Text size="xs" fw={600} c="accent">Toegewezen ouders</Text>
                                                    <Button
                                                        component={Link}
                                                        href={`/profiel/intro-attendance?group=${group.id}`}
                                                        size="xs"
                                                        leftSection={<ClipboardCheck size={14} />}
                                                    >
                                                        Bekijk aanwezigheid
                                                    </Button>
                                                </Group>
                                            )}

                                            <Group gap="xs" wrap="wrap">
                                                {group.leaders.length === 0 && (
                                                    <Text size="xs" c="dimmed">Nog geen ouders toegewezen</Text>
                                                )}
                                                {group.leaders.map(leader => (
                                                    <Badge
                                                        key={leader.user_id}
                                                        size="lg"
                                                        rightSection={
                                                            <ActionIcon
                                                                type="button"
                                                                size="xs"
                                                                color="error"
                                                                onClick={() => { void onRemoveLeader(group.id, leader.user_id); }}
                                                                title="Verwijderen"
                                                                aria-label="Verwijderen"
                                                            >
                                                                <X size={12} />
                                                            </ActionIcon>
                                                        }
                                                    >
                                                        {leader.first_name} {leader.last_name}
                                                    </Badge>
                                                ))}
                                            </Group>

                                            {pickerGroupId === group.id ? (
                                                <Group gap="xs" wrap="wrap">
                                                    <Select
                                                        placeholder="Kies een goedgekeurde ouder..."
                                                        searchable
                                                        value={null}
                                                        onChange={(val) => {
                                                            if (val) {
                                                                void onAddLeader(group.id, val);
                                                                setPickerGroupId(null);
                                                            }
                                                        }}
                                                        data={availableOuders().map(o => ({
                                                            value: o.user_id,
                                                            label: `${o.first_name} ${o.last_name} (${o.email})`,
                                                        }))}
                                                        miw={280}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        onClick={() => setPickerGroupId(null)}
                                                        leftSection={<X size={14} />}
                                                    >
                                                        Annuleren
                                                    </Button>
                                                </Group>
                                            ) : (
                                                <Group>
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        onClick={() => setPickerGroupId(group.id)}
                                                        leftSection={<UserPlus size={14} />}
                                                    >
                                                        Ouder toevoegen
                                                    </Button>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Box>
                                </Collapse>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </Stack>
    );
}
