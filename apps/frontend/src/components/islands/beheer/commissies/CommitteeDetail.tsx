'use client';

import {
    Users,
    UserMinus,
    Shield,
    Mail,
    Info,
    Award,
    ShieldAlert,
    Settings,
    Save,
    ExternalLink,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Center,
    Divider,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { Committee, CommitteeMember } from '@/server/queries/commissies/beheer-commissies.queries';
import { type UserBasic } from '@salvemundi/validations';
import BeheerLedenSearch from '@/components/ui/beheer/BeheerLedenSearch';

interface Props {
    selected: Committee;
    members: CommitteeMember[];
    isUpdating: boolean;
    actionLoading: string | null;
    editingDetail: boolean;
    onToggleEditing: () => void;
    editShortDesc: string;
    onShortDescChange: (descValue: string) => void;
    editDesc: string;
    onDescChange: (descValue: string) => void;
    onSaveDetail: () => void;
    savingDetail: boolean;
    onAddMember: (user: UserBasic) => void;
    addingMember: boolean;
    addError: string | null;
    onRemoveMember: (m: CommitteeMember) => void;
    onToggleLeader: (m: CommitteeMember) => void;
}

const slugify = (name: string) =>
    name.toLowerCase().replace(/\s*(\|\||\|)\s*salve mundi/gi, '').trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export default function CommitteeDetail({
    selected,
    members,
    isUpdating,
    actionLoading,
    editingDetail,
    onToggleEditing,
    editShortDesc,
    onShortDescChange,
    editDesc,
    onDescChange,
    onSaveDetail,
    savingDetail,
    onAddMember,
    addingMember,
    addError,
    onRemoveMember,
    onToggleLeader
}: Props) {
    return (
        <Stack gap="lg">
            <Card
                withBorder
                padding="xl"
                style={{ borderTop: '6px solid var(--mantine-color-accent-filled)' }}
            >
                <Stack gap="lg">
                    <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                        <Group gap="md" align="center" style={{ flex: 1, minWidth: 0 }}>
                            <ThemeIcon size={56} radius="md" variant="light" color="accent">
                                <Users size={28} />
                            </ThemeIcon>
                            <Stack gap={4} style={{ minWidth: 0 }}>
                                <Title order={2} size="h2">
                                    {selected.name}
                                </Title>
                                {selected.email && (
                                    <Group gap={6}>
                                        <Text span c="accent" lh={1}><Mail size={14} /></Text>
                                        <Text size="xs" c="dimmed">{selected.email}</Text>
                                    </Group>
                                )}
                            </Stack>
                        </Group>

                        <Group gap="sm">
                            <Button
                                component="a"
                                href={`/commissies/${slugify(selected.name)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                variant="default"
                                leftSection={<ExternalLink size={16} />}
                            >
                                Website
                            </Button>
                            <Button
                                type="button"
                                variant={editingDetail ? 'filled' : 'default'}
                                color={editingDetail ? 'accent' : undefined}
                                onClick={onToggleEditing}
                                leftSection={<Settings size={16} />}
                            >
                                {editingDetail ? 'Annuleren' : 'Details'}
                            </Button>
                        </Group>
                    </Group>

                    {!editingDetail && (
                        <Text size="md" c="dimmed" lineClamp={3}>
                            {selected.short_description || 'Geen beschrijving beschikbaar.'}
                        </Text>
                    )}

                    {editingDetail && (
                        <Stack gap="md">
                            <Divider />
                            <Textarea
                                label="Preview tekst"
                                value={editShortDesc}
                                onChange={(e) => onShortDescChange(e.currentTarget.value)}
                                rows={2}
                                autoComplete="off"
                                placeholder="Korte pakkende tekst over de commissie..."
                            />
                            <Textarea
                                label="Volledige beschrijving (Markdown)"
                                value={editDesc}
                                onChange={(e) => onDescChange(e.currentTarget.value)}
                                rows={12}
                                autoComplete="off"
                                styles={{ input: { fontFamily: 'monospace' } }}
                                placeholder="### Onze missie..."
                            />
                            <Button
                                type="button"
                                color="accent"
                                size="md"
                                fullWidth
                                loading={savingDetail}
                                onClick={onSaveDetail}
                                leftSection={<Save size={18} />}
                            >
                                Wijzigingen Opslaan
                            </Button>
                        </Stack>
                    )}
                </Stack>
            </Card>

            <Card withBorder padding={0} style={{ overflow: 'hidden' }}>
                <Stack gap={0}>
                    <Group justify="space-between" align="center" wrap="wrap" gap="md" p="xl">
                        <Stack gap={2}>
                            <Group gap="xs">
                                <Text span c="accent" lh={1}><Shield size={20} /></Text>
                                <Title order={3} size="h4">Leden &amp; Azure rechten</Title>
                            </Group>
                            <Text size="xs" c="dimmed">Synchroniseer toegang tot Office groepen</Text>
                        </Stack>

                        <Box w={{ base: '100%', md: 360 }}>
                            {selected.azure_group_id ? (
                                <Stack gap="xs">
                                    <BeheerLedenSearch
                                        onSelect={onAddMember}
                                        disabled={addingMember}
                                        placeholder="Zoek lid op naam om toe te voegen..."
                                    />
                                    {addError && (
                                        <Alert color="error" variant="light" icon={<ShieldAlert size={14} />}>
                                            <Text size="xs" fw={600}>{addError}</Text>
                                        </Alert>
                                    )}
                                </Stack>
                            ) : (
                                <Alert color="accent" variant="light" icon={<ShieldAlert size={16} />}>
                                    <Text size="xs" fw={600}>Geen Azure-koppeling</Text>
                                </Alert>
                            )}
                        </Box>
                    </Group>

                    <Divider />

                    <Box
                        p="xl"
                        style={{
                            opacity: isUpdating ? 0.5 : 1,
                            pointerEvents: isUpdating ? 'none' : 'auto',
                            transition: 'opacity 300ms ease',
                        }}
                    >
                        {isUpdating && members.length === 0 ? (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <Loader color="accent" />
                                    <Text size="sm" c="dimmed">Leden laden...</Text>
                                </Stack>
                            </Center>
                        ) : members.length === 0 ? (
                            <Paper withBorder p="xl" ta="center" style={{ borderStyle: 'dashed' }}>
                                <Stack align="center" gap="xs" py="lg">
                                    <Users size={40} opacity={0.15} />
                                    <Text size="sm" c="dimmed" fs="italic">Nog geen leden in deze groep</Text>
                                </Stack>
                            </Paper>
                        ) : (
                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                {members.map((member) => {
                                    const initials = member.displayName
                                        .split(' ')
                                        .map((n) => n[0])
                                        .join('')
                                        .substring(0, 2)
                                        .toUpperCase();

                                    return (
                                        <Paper key={member.entraId} withBorder p="md" radius="lg">
                                            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
                                                <Group gap="md" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                                                    <Avatar radius="md" color="brand" size="md">
                                                        {initials}
                                                    </Avatar>
                                                    <Stack gap={2} style={{ minWidth: 0 }}>
                                                        <Group gap="xs" wrap="nowrap">
                                                            <Text size="sm" fw={600} truncate>
                                                                {member.displayName}
                                                            </Text>
                                                            {member.isLeader && (
                                                                <Badge
                                                                    color="accent"
                                                                    variant="filled"
                                                                    size="xs"
                                                                    leftSection={<Award size={10} />}
                                                                >
                                                                    Leider
                                                                </Badge>
                                                            )}
                                                        </Group>
                                                        <Text size="xs" c="dimmed" truncate>
                                                            {member.email}
                                                        </Text>
                                                    </Stack>
                                                </Group>

                                                <Group gap="xs" wrap="nowrap">
                                                    {member.directusMembershipId && (
                                                        <ActionIcon
                                                            type="button"
                                                            variant={member.isLeader ? 'light' : 'default'}
                                                            color={member.isLeader ? 'accent' : undefined}
                                                            onClick={() => onToggleLeader(member)}
                                                            disabled={!!actionLoading}
                                                            loading={actionLoading === `leader-${member.entraId}`}
                                                            title="Rechten status omschakelen"
                                                            aria-label="Rechten status omschakelen"
                                                        >
                                                            <Award size={16} />
                                                        </ActionIcon>
                                                    )}
                                                    {selected.azure_group_id && (
                                                        <ActionIcon
                                                            type="button"
                                                            variant="default"
                                                            color="error"
                                                            onClick={() => onRemoveMember(member)}
                                                            disabled={!!actionLoading}
                                                            loading={actionLoading === `remove-${member.entraId}`}
                                                            title="Verwijderen uit Azure groep"
                                                            aria-label="Verwijderen uit Azure groep"
                                                        >
                                                            <UserMinus size={16} />
                                                        </ActionIcon>
                                                    )}
                                                </Group>
                                            </Group>
                                        </Paper>
                                    );
                                })}
                            </SimpleGrid>
                        )}
                    </Box>

                    <Divider />

                    <Alert color="brand" variant="light" icon={<Info size={16} />} radius={0}>
                        <Text size="xs" fs="italic">
                            Let op: Wijzigingen via Azure (Entra ID) service duren circa 2-5 minuten voordat ze volledig verwerkt en zichtbaar zijn in de website cache.
                        </Text>
                    </Alert>
                </Stack>
            </Card>
        </Stack>
    );
}
