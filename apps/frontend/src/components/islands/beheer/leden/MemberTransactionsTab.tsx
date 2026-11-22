'use client';

import { CreditCard } from 'lucide-react';
import {
    Badge,
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
import { safeConsoleError } from '@/server/utils/logger';

export interface MemberTransaction {
    id: number;
    created_at: string | null;
    product_name: string | null;
    amount: number | null;
    payment_status: string | null;
    mollie_id: string | null;
    product_type: string | null;
}

interface Props {
    transactions: MemberTransaction[];
}

export function TransactionStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <Badge size="sm" color="success">
                    Betaald
                </Badge>
            );
        case 'expired':
            return (
                <Badge size="sm">
                    Verlopen
                </Badge>
            );
        case 'failed':
        case 'canceled':
            return (
                <Badge size="sm" color="error">
                    Mislukt
                </Badge>
            );
        default:
            return (
                <Badge size="sm" color="accent">
                    Open
                </Badge>
            );
    }
}

export default function MemberTransactionsTab({ transactions }: Props) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Onbekend';
        try {
            return new Intl.DateTimeFormat('nl-NL', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(dateString));
        } catch (error) {
            safeConsoleError('[MemberTransactionsTab.tsx][formatDate] ', error);
            return 'Onbekend';
        }
    };

    const formatAmount = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined) return '€ 0,00';
        try {
            return new Intl.NumberFormat('nl-NL', {
                style: 'currency',
                currency: 'EUR',
            }).format(amount);
        } catch (error) {
            safeConsoleError('[MemberTransactionsTab.tsx][formatAmount] ', error);
            return `€ ${amount}`;
        }
    };

    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Box p="xl">
                <Title order={3} size="h4">
                    Transactie Geschiedenis
                </Title>
                <Text size="xs" c="dimmed" mt={4}>
                    Overzicht van alle lidmaatschap, webshop en activiteit betalingen
                </Text>
            </Box>

            <Divider />

            {transactions.length === 0 ? (
                <Center py={80}>
                    <Stack align="center" gap="xs">
                        <Text span c="dimmed" lh={1}>
                            <CreditCard size={40} />
                        </Text>
                        <Text size="xs" fw={600} c="dimmed">
                            Nog geen transacties gevonden
                        </Text>
                    </Stack>
                </Center>
            ) : (
                <ScrollArea.Autosize mah="60vh">
                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="xl">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Product / Omschrijving</Table.Th>
                                <Table.Th>Type</Table.Th>
                                <Table.Th>Mollie ID</Table.Th>
                                <Table.Th>Datum</Table.Th>
                                <Table.Th>Bedrag</Table.Th>
                                <Table.Th ta="right">Status</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {transactions.map((tx) => (
                                <Table.Tr key={tx.id}>
                                    <Table.Td>
                                        <Text fw={600} size="sm">
                                            {tx.product_name || 'Lidmaatschap betaling'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed" tt="capitalize">
                                            {tx.product_type || 'onbekend'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed" ff="monospace">
                                            {tx.mollie_id || '-'}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text size="xs" c="dimmed">
                                            {formatDate(tx.created_at)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600} size="sm">
                                            {formatAmount(tx.amount)}
                                        </Text>
                                    </Table.Td>
                                    <Table.Td ta="right">
                                        <TransactionStatus status={tx.payment_status || 'open'} />
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
