'use client';

import { Shield, Award, Hash, type LucideIcon } from 'lucide-react';
import {
    Badge,
    Box,
    Card,
    Group,
    Paper,
    Stack,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { COMMITTEES } from '@/shared/lib/permissions-config';

interface CommitteeMembership {
    committee_id: {
        name: string;
        azure_group_id?: string | null;
    };
    is_leader?: boolean;
}

export function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
}) {
    return (
        <Group gap="md" wrap="nowrap">
            <ThemeIcon size="lg">
                <Icon size={18} />
            </ThemeIcon>
            <Box miw={0} flex={1}>
                <Text size="xs" fw={600} c="dimmed">
                    {label}
                </Text>
                <Text size="sm" fw={600} truncate>
                    {value}
                </Text>
            </Box>
        </Group>
    );
}

export function CommitteeCard({
    membership,
    cleanName,
}: {
    membership: CommitteeMembership;
    cleanName: (n: string) => string;
}) {
    return (
        <Card p="md" shadow="sm">
            <Group gap="md" wrap="nowrap">
                <ThemeIcon size="lg">
                    <Shield size={18} />
                </ThemeIcon>
                <Box miw={0} flex={1}>
                    <Text fw={600} truncate>
                        {cleanName(membership.committee_id.name)}
                    </Text>
                    {membership.is_leader &&
                        membership.committee_id.azure_group_id !== COMMITTEES.BESTUUR && (
                            <Badge
                                mt={4}
                                size="xs"
                                leftSection={<Award size={12} />}
                            >
                                Commissie Leider
                            </Badge>
                        )}
                </Box>
            </Group>
        </Card>
    );
}

export function GroupCard({
    membership,
    cleanName,
}: {
    membership: CommitteeMembership;
    cleanName: (n: string) => string;
}) {
    return (
        <Card p="sm" shadow="sm">
            <Group gap="md" wrap="nowrap">
                <ThemeIcon size="lg">
                    <Hash size={18} />
                </ThemeIcon>
                <Text size="sm" fw={600} truncate>
                    {cleanName(membership.committee_id.name)}
                </Text>
            </Group>
        </Card>
    );
}

export function SignupStatus({ status }: { status: string }) {
    switch (status) {
        case 'paid':
            return (
                <Badge size="sm" color="success">
                    Betaald
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

export function EmptyState({ icon: Icon, message }: { icon: LucideIcon; message: string }) {
    return (
        <Paper p="xl" withBorder style={{ borderStyle: 'dashed' }} ta="center">
            <Stack align="center" gap="xs" py="md">
                <ThemeIcon size="lg">
                    <Icon size={22} />
                </ThemeIcon>
                <Text size="sm" fw={500} c="dimmed" fs="italic">
                    {message}
                </Text>
            </Stack>
        </Paper>
    );
}

export const cleanName = (name: string) => {
    return name
        .replace(/\s*(\|\||\||–|-)\s*Salve\s*Mundi/gi, '')
        .replace(/\s*SaMu\s*(\|\||\|)\s*/gi, '')
        .trim();
};
