'use client';

import { Edit, Mail, Trash } from 'lucide-react';
import {
    ActionIcon,
    Anchor,
    Badge,
    Card,
    Group,
    Stack,
    Table,
    Text,
} from '@mantine/core';
import ResendTicketEmailButton from './ResendTicketEmailButton';
import GroupSelectDropdown from './GroupSelectDropdown';
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

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
}

interface SignupTableViewProps {
    filteredSignups: ExtendedSignup[];
    groupNames: string[];
    groupConfigs: GroupConfig[];
    onUpdateGroup?: (signupId: number, newGroupName: string | null) => Promise<void>;
    onEdit: (id: number | string) => void;
    onDelete: (id: number | string) => void;
    getParticipants: (signup: ExtendedSignup) => Participant[];
}

export default function SignupTableView({
    filteredSignups,
    groupNames,
    groupConfigs,
    onEdit,
    onDelete,
    onUpdateGroup,
    getParticipants,
}: SignupTableViewProps) {
    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={720}>
                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Deelnemers</Table.Th>
                            <Table.Th ta="center">Tickets</Table.Th>
                            <Table.Th visibleFrom="lg">Vereniging</Table.Th>
                            <Table.Th>Groep</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredSignups.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={4} py={64} ta="center">
                                    <Text size="sm" c="dimmed" fs="italic">
                                        Geen aanmeldingen gevonden.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            filteredSignups.map((signup) => {
                                const participants = getParticipants(signup);
                                const isLeaderOfGroup = groupConfigs.find((g) =>
                                    (g.leaders || []).some(
                                        (l) => l.signupId === Number(signup.id)
                                    )
                                )?.name;

                                return (
                                    <Table.Tr key={signup.id}>
                                        <Table.Td miw={300}>
                                            <Stack gap={4}>
                                                <Anchor
                                                    component="a"
                                                    href={`mailto:${signup.email ?? ''}`}
                                                    title={signup.email ?? ''}
                                                    size="sm"
                                                    fw={600}
                                                    underline="hover"
                                                >
                                                    <Group gap={6} wrap="nowrap">
                                                        <Mail size={14} />
                                                        <Text span fw={600}>
                                                            {signup.name}
                                                        </Text>
                                                        <Text span size="xs" c="dimmed">
                                                            ({signup.email})
                                                        </Text>
                                                    </Group>
                                                </Anchor>

                                                {isLeaderOfGroup && (
                                                    <Badge
                                                        size="xs"
                                                        variant="light"
                                                        color="accent"
                                                        w="fit-content"
                                                    >
                                                        👑 Groepsleider ({isLeaderOfGroup})
                                                    </Badge>
                                                )}

                                                {participants.length > 0 && (
                                                    <Group gap={6} wrap="wrap" mt={2}>
                                                        {participants.map((p, i) => {
                                                            const rawName = p.name || 'Onbekend';
                                                            const rawInitial = p.initial || '';

                                                            return (
                                                                <Badge
                                                                    key={i}
                                                                    size="xs"
                                                                    variant="default"
                                                                >
                                                                    {rawName}
                                                                    {rawInitial ? ` ${rawInitial}` : ''}
                                                                </Badge>
                                                            );
                                                        })}
                                                    </Group>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge size="sm" variant="light" color="brand">
                                                {signup.amount_tickets}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td visibleFrom="lg">
                                            <Text size="xs" c="dimmed">
                                                {signup.association || '-'}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="sm" wrap="nowrap">
                                                {onUpdateGroup && groupNames.length > 0 ? (
                                                    <GroupSelectDropdown
                                                        value={signup.group_name || ''}
                                                        options={groupNames}
                                                        onChange={(val) => {
                                                            void onUpdateGroup(
                                                                Number(signup.id),
                                                                val
                                                            );
                                                        }}
                                                        size="xs"
                                                    />
                                                ) : (
                                                    <Text size="xs" fw={600} c="dimmed">
                                                        {signup.group_name || 'Niet ingedeeld'}
                                                    </Text>
                                                )}

                                                <Group gap={4} wrap="nowrap">
                                                    <ResendTicketEmailButton
                                                        signupId={Number(signup.id)}
                                                        email={signup.email}
                                                        paid={signup.payment_status === 'paid'}
                                                    />
                                                    <ActionIcon
                                                        type="button"
                                                        variant="subtle"
                                                        color="brand"
                                                        onClick={() => signup.id && onEdit(signup.id)}
                                                        title="Inschrijving bewerken"
                                                        aria-label="Inschrijving bewerken"
                                                    >
                                                        <Edit size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon
                                                        type="button"
                                                        variant="subtle"
                                                        color="error"
                                                        onClick={() =>
                                                            signup.id && onDelete(signup.id)
                                                        }
                                                        title="Inschrijving verwijderen"
                                                        aria-label="Inschrijving verwijderen"
                                                    >
                                                        <Trash size={14} />
                                                    </ActionIcon>
                                                </Group>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })
                        )}
                    </Table.Tbody>
                </Table>
            </Table.ScrollContainer>
        </Card>
    );
}
