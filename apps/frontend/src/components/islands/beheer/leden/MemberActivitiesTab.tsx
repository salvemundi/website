'use client';

import { History } from 'lucide-react';
import {
    Box,
    Card,
    Center,
    Divider,
    ScrollArea,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { SignupStatus } from './LedenSharedComponents';
import { safeConsoleError } from '@/server/utils/logger';

interface Signup {
    id: number;
    payment_status?: string | null;
    created_at: string;
    event_id: {
        id: string;
        name: string;
        event_date: string;
    };
}

interface Props {
    signups: Signup[];
}

export default function MemberActivitiesTab({ signups }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).format(new Date(dateString));
        } catch (error) {
            safeConsoleError('[MemberActivitiesTab.tsx][MemberActivitiesTab] ', error);
            return 'Onbekend';
        }
    };

    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Box p="xl">
                <Title order={3} size="h4">
                    Activiteiten Historie
                </Title>
                <Text size="xs" c="dimmed" mt={4}>
                    Recente inschrijvingen voor activiteiten
                </Text>
            </Box>

            <Divider />

            {signups.length === 0 ? (
                <Center py={80}>
                    <Stack align="center" gap="xs">
                        <Text span c="dimmed" lh={1}>
                            <History size={40} />
                        </Text>
                        <Text size="xs" fw={600} c="dimmed">
                            Nog geen activiteiten gevonden
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <ScrollArea.Autosize mah="60vh">
                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="xl">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Activiteit</Table.Th>
                                <Table.Th>Datum</Table.Th>
                                <Table.Th ta="right">Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {signups.map((signup) => (
                                <Table.Tr key={signup.id}>
                                    <Table.Td>
                                        <Text fw={600} size="sm">
                                            {signup.event_id.name}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">
                                            {formatDate(signup.event_id.event_date)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <SignupStatus status={signup.payment_status || 'open'} />
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea.Autosize>
            )}
        </Card>
    );
}
