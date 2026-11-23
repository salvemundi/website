'use client';

import { useRouter } from 'next/navigation';
import { Users, Mail } from 'lucide-react';
import {
    Anchor,
    Avatar,
    Badge,
    Box,
    Card,
    Center,
    Divider,
    Group,
    Stack,
    Table,
    Text,
    Title,
} from '@mantine/core';
import { type BeheerMember } from '@salvemundi/validations';

export type Member = BeheerMember;

interface LedenTableProps {
    members: Member[];
    formatDate: (date: string | null | undefined) => string;
    isMembershipActive: (member: Member) => boolean;
}

export default function LedenTable({
    members = [],
    formatDate,
    isMembershipActive,
}: LedenTableProps) {
    const router = useRouter();

    return (
        <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
            <Box hiddenFrom="md">
                {members.map((member, index) => {
                    const active = isMembershipActive(member);
                    return (
                        <Box key={member.id}>
                            {index > 0 && <Divider />}
                            <Box
                                p="md"
                                onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <Group gap="sm" wrap="nowrap">
                                    <Avatar color="brand">
                                        {member.first_name?.[0]}
                                        {member.last_name?.[0]}
                                    </Avatar>
                                    <Box miw={0} flex={1}>
                                        <Text fw={600} size="sm" truncate>
                                            {member.first_name} {member.last_name}
                                        </Text>
                                        <Text size="xs" c="dimmed" truncate>
                                            {member.email}
                                        </Text>
                                    </Box>
                                    <Badge
                                        suppressHydrationWarning
                                        size="xs"
                                        color={active ? 'success' : 'error'}
                                        style={{ flexShrink: 0 }}
                                    >
                                        Tot {formatDate(member.membership_expiry)}
                                    </Badge>
                                </Group>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            <Box visibleFrom="md">
                <Table.ScrollContainer minWidth={720}>
                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="xl">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Lid</Table.Th>
                                <Table.Th>Contactgegevens</Table.Th>
                                <Table.Th>Validiteit</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {members.map((member) => {
                                const active = isMembershipActive(member);
                                return (
                                    <Table.Tr
                                        key={member.id}
                                        onClick={() => router.push(`/beheer/leden/${member.id}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <Table.Td>
                                            <Group gap="md" wrap="nowrap">
                                                <Avatar color="brand">
                                                    {member.first_name?.[0]}
                                                    {member.last_name?.[0]}
                                                </Avatar>
                                                <Box>
                                                    <Text fw={600} size="sm">
                                                        {member.first_name} {member.last_name}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">
                                                        Lid ID: {member.id.substring(0, 8)}
                                                    </Text>
                                                </Box>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap="xs" wrap="nowrap">
                                                <Text span c="dimmed" lh={1}>
                                                    <Mail size={15} />
                                                </Text>
                                                <Anchor
                                                    component="a"
                                                    href={`mailto:${member.email}`}
                                                    size="sm"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    {member.email}
                                                </Anchor>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                suppressHydrationWarning
                                                size="sm"
                                                color={active ? 'success' : 'error'}
                                            >
                                                Tot {formatDate(member.membership_expiry)}
                                            </Badge>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Box>

            {members.length === 0 && (
                <Center py={80} px="md">
                    <Stack align="center" gap="xs">
                        <Text span c="dimmed" lh={1}>
                            <Users size={48} />
                        </Text>
                        <Title order={3} size="h4">
                            Geen leden gevonden
                        </Title>
                        <Text size="sm" c="dimmed">
                            Pas de filters aan of probeer een andere zoekterm.
                        </Text>
                    </Stack>
                </Center>
            )}
        </Card>
    );
}
