'use client';

import { useMemo } from 'react';
import { CreditCard, Clock, Tag } from 'lucide-react';
import { Badge, Group, Paper, ScrollArea, Stack, Table, Text } from '@mantine/core';
import type { Transaction } from '@salvemundi/validations/schema/profiel.zod';
import { Tile } from './profile/ProfielUI';

const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    }).format(date);

interface TransactionsIslandProps {
    transactions?: Transaction[];
}

export const TransactionsIsland: React.FC<TransactionsIslandProps> = ({ transactions = [] }) => {
    const paidTransactions = useMemo(() => {
        return transactions.filter((t) => {
            const status = (t.payment_status || t.status || '').toLowerCase();
            return status === 'paid' || status === 'completed';
        });
    }, [transactions]);

    const getInferredTransactionType = (t: Transaction) => {
        return t.product_type || t.transaction_type || 'Overig';
    };

    const formatAmount = (amount: number | string | null | undefined): string => {
        const numAmount = amount === null || amount === undefined
            ? 0
            : typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(numAmount);
    };

    return (
        <Tile
            title="Mijn Betalingen"
            icon={<CreditCard size={22} />}
        >
            {paidTransactions.length === 0 ? (
                <Paper
                    p="xl"
                    radius="lg"
                    withBorder
                    ta="center"
                    style={{ borderStyle: 'dashed' }}
                >
                    <Stack gap="xs" align="center">
                        <Text size="lg" fw={700}>
                            Geen betaalde transacties gevonden.
                        </Text>
                        <Text size="sm" c="dimmed">
                            Zodra je een betaling afrondt, verschijnt deze hier.
                        </Text>
                    </Stack>
                </Paper>
            ) : (
                <ScrollArea>
                    <Table verticalSpacing="md" horizontalSpacing="md" highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>
                                    <Text size="xs" fw={900} tt="uppercase" c="brand">Datum</Text>
                                </Table.Th>
                                <Table.Th>
                                    <Text size="xs" fw={900} tt="uppercase" c="brand">Product</Text>
                                </Table.Th>
                                <Table.Th>
                                    <Text size="xs" fw={900} tt="uppercase" c="brand">Type</Text>
                                </Table.Th>
                                <Table.Th ta="right">
                                    <Text size="xs" fw={900} tt="uppercase" c="brand">Bedrag</Text>
                                </Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {paidTransactions.map((transaction) => (
                                <Table.Tr key={transaction.id}>
                                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Group gap="xs" wrap="nowrap">
                                            <Text span c="brand" lh={1}>
                                                <Clock size={16} />
                                            </Text>
                                            <Text size="sm" fw={700}>
                                                {formatDate(new Date(transaction.created_at || transaction.date_created || new Date()))}
                                            </Text>
                                        </Group>
                                    </Table.Td>
                                    <Table.Td>
                                        <Stack gap={4}>
                                            <Text size="sm" fw={900}>
                                                {transaction.product_name || transaction.description || 'Betaling'}
                                            </Text>
                                            {transaction.coupon_code && (
                                                <Group gap={4} c="brand">
                                                    <Tag size={12} />
                                                    <Text size="xs" fw={700} tt="uppercase">
                                                        {transaction.coupon_code}
                                                    </Text>
                                                </Group>
                                            )}
                                        </Stack>
                                    </Table.Td>
                                    <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                        <Badge variant="light" color="brand" size="sm">
                                            {getInferredTransactionType(transaction)}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td ta="right" style={{ whiteSpace: 'nowrap' }}>
                                        <Text size="sm" fw={900}>
                                            {formatAmount(transaction.amount)}
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            )}
        </Tile>
    );
};
