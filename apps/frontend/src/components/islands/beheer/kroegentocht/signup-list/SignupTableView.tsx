'use client';

import { Edit, FileDown, Mail, Trash } from 'lucide-react';
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
import { getParticipantNames } from '@/lib/utils/kroegentocht-signups';
import { type PubCrawlSignup } from '@salvemundi/validations/schema/pub-crawl.zod';

interface ExtendedSignup extends PubCrawlSignup {
    participants?: { name: string; initial: string }[];
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
    ticketsBySignup: Record<number, { id: number; name: string; initial: string; checkedIn: boolean }[]>;
}

export default function SignupTableView({
    filteredSignups,
    groupNames,
    groupConfigs,
    onEdit,
    onDelete,
    onUpdateGroup,
    ticketsBySignup,
}: SignupTableViewProps) {
    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={720}>
                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Inschrijving</Table.Th>
                            <Table.Th ta="center">Personen</Table.Th>
                            <Table.Th visibleFrom="lg">Vereniging</Table.Th>
                            <Table.Th>Tickets</Table.Th>
                            <Table.Th>Groep</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filteredSignups.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={5} py={64} ta="center">
                                    <Text size="sm" c="dimmed" fs="italic">
                                        Geen aanmeldingen gevonden.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            filteredSignups.map((signup) => {
                                const [primaryName, ...otherNames] = getParticipantNames(signup);
                                const leaderNames = new Set(
                                    groupConfigs.flatMap((g) =>
                                        (g.leaders || [])
                                            .filter((l) => l.signupId === Number(signup.id))
                                            .map((l) => l.name.trim().toLowerCase())
                                    )
                                );
                                const crown = (n: string) =>
                                    leaderNames.has(n.trim().toLowerCase()) ? '👑 ' : '';

                                const tickets = ticketsBySignup[Number(signup.id)] ?? [];
                                const checkedIn = tickets.filter((t) => t.checkedIn).length;
                                const mismatch = tickets.length !== signup.amount_tickets;

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
                                                            {crown(primaryName)}
                                                            {primaryName}
                                                        </Text>
                                                        <Text span size="xs" c="dimmed">
                                                            ({signup.email})
                                                        </Text>
                                                    </Group>
                                                </Anchor>

                                                {otherNames.length > 0 && (
                                                    <Stack gap={2} pl={20}>
                                                        {otherNames.map((name, i) => (
                                                            <Text key={i} size="xs" c="dimmed">
                                                                + {crown(name)}
                                                                {name}
                                                            </Text>
                                                        ))}
                                                    </Stack>
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
                                            <Group gap="xs" wrap="nowrap">
                                                <Text
                                                    size="xs"
                                                    fw={600}
                                                    c={mismatch ? 'error' : 'dimmed'}
                                                    title={
                                                        tickets
                                                            .map(
                                                                (t) =>
                                                                    `${t.name} ${t.initial}.${t.checkedIn ? ' – ingecheckt' : ''}`
                                                            )
                                                            .join('\n') || 'Geen tickets'
                                                    }
                                                >
                                                    {tickets.length} ticket{tickets.length === 1 ? '' : 's'}
                                                    {checkedIn > 0 ? ` · ${checkedIn} ingecheckt` : ''}
                                                    {mismatch ? ' ⚠' : ''}
                                                </Text>
                                                {tickets.length > 0 && (
                                                    <ActionIcon
                                                        component="a"
                                                        href={`/api/kroegentocht/tickets/${signup.id}`}
                                                        download
                                                        variant="subtle"
                                                        color="brand"
                                                        size="sm"
                                                        title="Tickets downloaden (PDF met QR-codes)"
                                                        aria-label="Tickets downloaden (PDF met QR-codes)"
                                                    >
                                                        <FileDown size={14} />
                                                    </ActionIcon>
                                                )}
                                            </Group>
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
