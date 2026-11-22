'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Crown, Plus, Users, X } from 'lucide-react';
import {
    Badge,
    Box,
    Button,
    Card,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import ResendTicketEmailButton from './ResendTicketEmailButton';
import GroupSelectDropdown from './GroupSelectDropdown';
import AddLeaderForm from './AddLeaderForm';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';
import { getParticipantNames } from '@/lib/utils/kroegentocht-signups';

interface Participant {
    name: string;
    initial: string;
}

interface ExtendedSignup extends PubCrawlSignup {
    participants?: Participant[];
    created_at: string;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

export type GroupAccentColor = 'brand' | 'accent' | 'success' | 'error';

interface GroupCardProps {
    groupName: string;
    groupSignups: ExtendedSignup[];
    totalTickets: number;
    leadersList?: GroupLeader[];
    participantsList: { name: string; association: string; signupId: number }[];
    groupNames: string[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onAddLeader?: (groupName: string, name: string, signupId: number | null) => void;
    onRemoveLeader?: (groupName: string, leader: GroupLeader) => void;
    color: GroupAccentColor;
    isUnassigned?: boolean;
    layoutColumns?: number;
}

export default function GroupCard({
    groupName,
    groupSignups,
    totalTickets,
    leadersList = [],
    participantsList,
    groupNames,
    onUpdateGroup,
    onAddLeader,
    onRemoveLeader,
    color,
    isUnassigned = false,
    layoutColumns = 1,
}: GroupCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showAddLeaderForm, setShowAddLeaderForm] = useState(false);
    const [confirmRemoveIdx, setConfirmRemoveIdx] = useState<number | null>(null);

    const isLeaderName = (signupId: number, name: string) =>
        !isUnassigned &&
        leadersList.some(
            (l) =>
                l.signupId === signupId &&
                l.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
    const signupBlocks = groupSignups.map((signup) => ({
        signup,
        names: getParticipantNames(signup),
    }));

    const limit = layoutColumns === 3 ? 12 : layoutColumns === 2 ? 8 : 5;
    const visibleBlocks = isExpanded ? signupBlocks : signupBlocks.slice(0, limit);

    const badgeColor = isUnassigned ? 'error' : color;
    const gridCols =
        layoutColumns === 3
            ? { base: 1, md: 2, lg: 3 }
            : layoutColumns === 2
              ? { base: 1, md: 2 }
              : 1;

    return (
        <Card
            withBorder
            p="lg"
            shadow="sm"
            style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderColor: isUnassigned ? 'var(--mantine-color-error-filled)' : undefined,
            }}
        >
            <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" miw={0}>
                        <ThemeIcon size={36} color={badgeColor}>
                            <Users size={18} />
                        </ThemeIcon>
                        <Box miw={0}>
                            <Title order={3} size="h5" c={badgeColor} lineClamp={1}>
                                {groupName}
                            </Title>
                            <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                                {groupSignups.length} aanmeldingen
                            </Text>
                        </Box>
                    </Group>

                    <Badge size="sm" color={badgeColor} style={{ flexShrink: 0 }}>
                        {totalTickets} {totalTickets === 1 ? 'deelnemer' : 'deelnemers'}
                    </Badge>
                </Group>

                <Divider />

                <Stack gap="sm">
                    {!isUnassigned && leadersList.length > 0 && (
                        <SimpleGrid cols={gridCols} spacing="xs">
                            {leadersList.map((leader, lIdx) => (
                                <Paper
                                    key={`leader-${lIdx}`}
                                    withBorder
                                    px="sm"
                                    py={6}
                                    style={{ borderColor: 'var(--mantine-color-accent-filled)' }}
                                >
                                    <Group justify="space-between" wrap="nowrap" gap="xs">
                                        <Group gap="xs" wrap="nowrap" miw={0}>
                                            <Text span c="accent" lh={1}>
                                                <Crown size={14} />
                                            </Text>
                                            <Box miw={0}>
                                                <Text
                                                    size="xs"
                                                    fw={700}
                                                    c="accent"
                                                    truncate
                                                    title={leader.name}
                                                >
                                                    {leader.name}
                                                </Text>
                                                <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                                                    Groepsleider {leader.signupId ? '' : '(Extern)'}
                                                </Text>
                                            </Box>
                                        </Group>
                                        {confirmRemoveIdx === lIdx ? (
                                            <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
                                                <Button
                                                    type="button"
                                                    size="compact-xs"
                                                    color="error"
                                                    onClick={() => {
                                                        setConfirmRemoveIdx(null);
                                                        onRemoveLeader?.(groupName, leader);
                                                    }}
                                                >
                                                    Ja, afzetten
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="compact-xs"
                                                    onClick={() => setConfirmRemoveIdx(null)}
                                                >
                                                    Nee
                                                </Button>
                                            </Group>
                                        ) : (
                                            <Button
                                                type="button"
                                                size="compact-xs"
                                                color="error"
                                                leftSection={<X size={12} />}
                                                onClick={() => setConfirmRemoveIdx(lIdx)}
                                                title="Groepsleider afzetten (wordt weer gewone deelnemer)"
                                                style={{ flexShrink: 0 }}
                                            >
                                                Afzetten
                                            </Button>
                                        )}
                                    </Group>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    )}

                    {signupBlocks.length === 0 ? (
                        <Text py="sm" ta="center" size="xs" c="dimmed" fs="italic">
                            Geen deelnemers in deze groep
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            <SimpleGrid cols={gridCols} spacing="xs">
                                {visibleBlocks.map(({ signup, names }) => {
                                    const [primary, ...others] = names;
                                    const sid = Number(signup.id);
                                    return (
                                        <Paper
                                            key={String(signup.id)}
                                            withBorder
                                            px="sm"
                                            py={6}
                                        >
                                            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                                                <Stack gap={2} miw={0} flex={1}>
                                                    <Group gap={4} wrap="nowrap" miw={0}>
                                                        {isLeaderName(sid, primary) && (
                                                            <Text span c="accent" lh={1} style={{ flexShrink: 0 }}>
                                                                <Crown size={12} />
                                                            </Text>
                                                        )}
                                                        <Text size="xs" fw={600} truncate title={primary}>
                                                            {primary}
                                                        </Text>
                                                    </Group>
                                                    {others.map((name, i) => (
                                                        <Group key={i} gap={4} wrap="nowrap" pl={8} miw={0}>
                                                            {isLeaderName(sid, name) && (
                                                                <Text span c="accent" lh={1} style={{ flexShrink: 0 }}>
                                                                    <Crown size={12} />
                                                                </Text>
                                                            )}
                                                            <Text size="xs" c="dimmed" truncate title={name}>
                                                                + {name}
                                                            </Text>
                                                        </Group>
                                                    ))}
                                                    <Text size="xs" c="dimmed" truncate>
                                                        {signup.association || '-'}
                                                    </Text>
                                                </Stack>

                                                {onUpdateGroup && (
                                                    <GroupSelectDropdown
                                                        value={isUnassigned ? '' : groupName}
                                                        options={groupNames}
                                                        onChange={(val) => {
                                                            void onUpdateGroup(sid, val);
                                                        }}
                                                        size="xs"
                                                    />
                                                )}
                                            </Group>
                                        </Paper>
                                    );
                                })}
                            </SimpleGrid>

                            {signupBlocks.length > limit && (
                                <Button
                                    type="button"
                                    size="xs"
                                    fullWidth
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    rightSection={
                                        isExpanded ? (
                                            <ChevronUp size={14} />
                                        ) : (
                                            <ChevronDown size={14} />
                                        )
                                    }
                                >
                                    {isExpanded
                                        ? 'Toon minder'
                                        : `Toon alles (${signupBlocks.length - limit} meer)`}
                                </Button>
                            )}
                        </Stack>
                    )}
                </Stack>
            </Stack>

            <Box mt="md">
                <Divider mb="sm" />
                <Stack gap="xs">
                    {groupSignups.map((signup) => (
                        <Group
                            key={String(signup.id)}
                            justify="space-between"
                            wrap="wrap"
                            gap="xs"
                        >
                            <Text size="xs" c="dimmed">
                                {signup.name}
                            </Text>
                            <ResendTicketEmailButton
                                signupId={Number(signup.id)}
                                email={signup.email}
                                paid={signup.payment_status === 'paid'}
                            />
                        </Group>
                    ))}
                </Stack>

                {!isUnassigned && onAddLeader && (
                    <Box mt="sm">
                        <Divider mb="sm" />
                        {showAddLeaderForm ? (
                            <AddLeaderForm
                                participantsList={participantsList}
                                onAdd={(name, signupId) => {
                                    onAddLeader(groupName, name, signupId);
                                    setShowAddLeaderForm(false);
                                }}
                                onCancel={() => setShowAddLeaderForm(false)}
                            />
                        ) : (
                            <Button
                                type="button"
                                size="xs"
                                fullWidth
                                onClick={() => setShowAddLeaderForm(true)}
                                leftSection={<Plus size={12} />}
                            >
                                Leider toevoegen
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </Card>
    );
}
