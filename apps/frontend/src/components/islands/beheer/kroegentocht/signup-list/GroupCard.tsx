'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Crown, Plus, Users, X } from 'lucide-react';
import {
    ActionIcon,
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

    const regularParticipants = isUnassigned
        ? participantsList
        : participantsList.filter(
              (p) =>
                  !leadersList.some(
                      (l) =>
                          l.signupId === p.signupId &&
                          l.name.toLowerCase() === p.name.toLowerCase()
                  )
          );

    const limit = layoutColumns === 3 ? 12 : layoutColumns === 2 ? 8 : 5;
    const visibleParticipants = isExpanded
        ? regularParticipants
        : regularParticipants.slice(0, limit);

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
                borderColor: isUnassigned ? 'var(--destructive)' : undefined,
            }}
        >
            <Stack gap="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap" miw={0}>
                        <ThemeIcon size={36} radius="md" variant="light" color={badgeColor}>
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

                    <Badge size="sm" variant="light" color={badgeColor} style={{ flexShrink: 0 }}>
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
                                    radius="md"
                                    style={{ borderColor: 'var(--accent)' }}
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
                                        <ActionIcon
                                            type="button"
                                            size="sm"
                                            variant="subtle"
                                            color="error"
                                            onClick={() => onRemoveLeader?.(groupName, leader)}
                                            title="Verwijder groepsleider"
                                            aria-label="Verwijder groepsleider"
                                        >
                                            <X size={14} />
                                        </ActionIcon>
                                    </Group>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    )}

                    {participantsList.length === 0 ? (
                        <Text py="sm" ta="center" size="xs" c="dimmed" fs="italic">
                            Geen deelnemers in deze groep
                        </Text>
                    ) : (
                        <Stack gap="xs">
                            <SimpleGrid cols={gridCols} spacing="xs">
                                {visibleParticipants.map((p, idx) => (
                                    <Paper key={idx} withBorder px="sm" py={6} radius="md">
                                        <Group justify="space-between" wrap="nowrap" gap="xs">
                                            <Box miw={0}>
                                                <Text size="xs" fw={600} truncate title={p.name}>
                                                    {p.name}
                                                </Text>
                                                <Text size="xs" c="dimmed" truncate>
                                                    {p.association}
                                                </Text>
                                            </Box>

                                            {onUpdateGroup && (
                                                <GroupSelectDropdown
                                                    value={isUnassigned ? '' : groupName}
                                                    options={groupNames}
                                                    onChange={(val) => {
                                                        void onUpdateGroup(p.signupId, val);
                                                    }}
                                                    size="xs"
                                                />
                                            )}
                                        </Group>
                                    </Paper>
                                ))}
                            </SimpleGrid>

                            {regularParticipants.length > limit && (
                                <Button
                                    type="button"
                                    variant="default"
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
                                        : `Toon alle ${regularParticipants.length}`}
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
                                variant="default"
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
