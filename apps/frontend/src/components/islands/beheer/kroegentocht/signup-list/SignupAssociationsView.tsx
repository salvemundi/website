'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Box, Card, Table, Text, TextInput } from '@mantine/core';
import {
    getAssociationStats,
    normalizeSearch,
    type KroegSignupLike,
} from '@/lib/utils/kroegentocht-signups';

interface SignupAssociationsViewProps {
    signups: KroegSignupLike[];
}

export default function SignupAssociationsView({ signups }: SignupAssociationsViewProps) {
    const [query, setQuery] = useState('');
    const stats = useMemo(() => getAssociationStats(signups), [signups]);
    const filtered = stats.filter((s) =>
        normalizeSearch(s.association).includes(normalizeSearch(query))
    );
    const totals = stats.reduce(
        (acc, s) => ({
            signups: acc.signups + s.signups,
            participants: acc.participants + s.participants,
        }),
        { signups: 0, participants: 0 }
    );

    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Box p="md">
                <TextInput
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Zoek vereniging..."
                    leftSection={<Search size={16} />}
                    autoComplete="off"
                />
            </Box>
            <Table.ScrollContainer minWidth={480}>
                <Table highlightOnHover verticalSpacing="sm" horizontalSpacing="lg">
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Vereniging</Table.Th>
                            <Table.Th ta="right">Personen</Table.Th>
                            <Table.Th ta="right">Inschrijvingen</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {filtered.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={3} py={48} ta="center">
                                    <Text size="sm" c="dimmed" fs="italic">
                                        Geen verenigingen gevonden.
                                    </Text>
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            filtered.map((s) => (
                                <Table.Tr key={s.association}>
                                    <Table.Td>
                                        <Text size="sm" fw={600}>
                                            {s.association}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Text
                                            size="sm"
                                            fw={700}
                                            c="brand"
                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {s.participants}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <Text
                                            size="sm"
                                            c="dimmed"
                                            style={{ fontVariantNumeric: 'tabular-nums' }}
                                        >
                                            {s.signups}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))
                        )}
                    </Table.Tbody>
                    <Table.Tfoot>
                        <Table.Tr>
                            <Table.Td>
                                <Text size="xs" fw={700}>
                                    Totaal ({stats.length} verenigingen)
                                </Text>
                            </Table.Td>
                            <Table.Td ta="right">
                                <Text
                                    size="xs"
                                    fw={700}
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {totals.participants}
                                </Text>
                            </Table.Td>
                            <Table.Td ta="right">
                                <Text
                                    size="xs"
                                    fw={700}
                                    c="dimmed"
                                    style={{ fontVariantNumeric: 'tabular-nums' }}
                                >
                                    {totals.signups}
                                </Text>
                            </Table.Td>
                        </Table.Tr>
                    </Table.Tfoot>
                </Table>
            </Table.ScrollContainer>
        </Card>
    );
}
