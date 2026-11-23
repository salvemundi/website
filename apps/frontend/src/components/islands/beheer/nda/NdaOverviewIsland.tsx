'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    FileSignature,
    ShieldCheck,
    Clock,
    AlertTriangle,
    XCircle,
    Users,
    RefreshCw,
} from 'lucide-react';
import {
    Box,
    Button,
    Card,
    Divider,
    Group,
    NativeSelect,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import type { NdaCommitteeOverview, NdaCommitteeMember } from '@/server/queries/nda/beheer-nda.queries';
import { setNdaSecretary, setNdaSystemActive } from '@/server/actions/beheer/nda/beheer-nda-settings.actions';
import { checkExpiredAndRenewNdas } from '@/server/actions/beheer/nda/beheer-nda-signatures.actions';

interface Props {
    initialOverview: NdaCommitteeOverview[];
    bestuurMembers: NdaCommitteeMember[];
    initialSecretaryUserId: string | null;
    initialIsActive: boolean;
}

function getTemplateStatusLabel(status: string): string {
    switch (status) {
        case 'draft':
            return 'Concept';
        case 'signed':
            return 'Bevestigd, klaar om te versturen';
        case 'archived':
            return 'Gearchiveerd';
        default:
            return status;
    }
}

export default function NdaOverviewIsland({
    initialOverview,
    bestuurMembers,
    initialSecretaryUserId,
    initialIsActive,
}: Props) {
    const [secretaryUserId, setSecretaryUserId] = useState(initialSecretaryUserId ?? '');
    const [savingSecretary, setSavingSecretary] = useState(false);
    const [checking, setChecking] = useState(false);
    const [checkResult, setCheckResult] = useState<string | null>(null);
    const [isActive, setIsActive] = useState(initialIsActive);
    const [togglingActive, setTogglingActive] = useState(false);

    const handleSecretaryChange = async (userId: string) => {
        setSecretaryUserId(userId);
        setSavingSecretary(true);
        await setNdaSecretary(userId);
        setSavingSecretary(false);
    };

    const handleCheckExpiry = async () => {
        setChecking(true);
        setCheckResult(null);
        const result = await checkExpiredAndRenewNdas();
        setChecking(false);
        setCheckResult(
            `${result.expiredCount} NDA('s) verlopen gezet, ${result.renewalsSent} verlenging(en) verstuurd.`
        );
    };

    const handleToggleActive = async () => {
        setTogglingActive(true);
        const result = await setNdaSystemActive(!isActive);
        setTogglingActive(false);
        if (result.success) {
            setIsActive(result.active ?? !isActive);
        }
    };

    return (
        <Stack gap="xl">
            <Card p="lg" shadow="sm">
                <Stack gap="lg">
                    <Group justify="space-between" wrap="nowrap" gap="md">
                        <Box>
                            <Text size="sm" fw={600}>
                                NDA-systeem actief
                            </Text>
                            <Text size="xs" c="dimmed" mt={2}>
                                Zet aan om de NDA-pagina zichtbaar te maken voor leden en de dagelijkse automatische verloop-check in te schakelen.
                            </Text>
                        </Box>
                        <Switch
                            checked={isActive}
                            onChange={() => {
                                void handleToggleActive();
                            }}
                            disabled={togglingActive}
                            aria-label="NDA-systeem actief"
                        />
                    </Group>

                    <Divider />

                    <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                        <NativeSelect
                            label="Secretaris (ondertekent namens de vereniging)"
                            value={secretaryUserId}
                            onChange={(e) => {
                                void handleSecretaryChange(e.target.value);
                            }}
                            disabled={savingSecretary}
                            maw={384}
                            flex={1}
                            data={[
                                { value: '', label: 'Nog niet ingesteld' },
                                ...bestuurMembers.map((m) => ({
                                    value: m.userId,
                                    label: m.displayName,
                                })),
                            ]}
                        />

                        <Stack gap={6} align="flex-end">
                            <Button
                                type="button"
                                loading={checking}
                                leftSection={<RefreshCw size={16} />}
                                onClick={() => {
                                    void handleCheckExpiry();
                                }}
                            >
                                Controleer verlopen NDA&apos;s
                            </Button>
                            {checkResult && (
                                <Text size="xs" c="dimmed">
                                    {checkResult}
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Stack>
            </Card>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {initialOverview.map((row) => (
                    <Card
                        key={row.committee.id}
                        component={Link}
                        href={`/beheer/nda/${row.committee.id}`}
                        p="lg"
                        shadow="sm"
                        style={{ textDecoration: 'none' }}
                    >
                        <Stack gap="md">
                            <Group gap="sm" wrap="nowrap">
                                <ThemeIcon size="lg">
                                    <FileSignature size={20} />
                                </ThemeIcon>
                                <Box miw={0} flex={1}>
                                    <Title order={4} size="h5" lineClamp={1}>
                                        {row.committee.name}
                                    </Title>
                                    <Text size="xs" c="dimmed">
                                        {row.templateStatus
                                            ? `${getTemplateStatusLabel(row.templateStatus)} (${row.templateYear})`
                                            : 'Geen NDA geüpload'}
                                    </Text>
                                </Box>
                            </Group>

                            <Group gap="md" wrap="wrap">
                                <Group gap={4}>
                                    <Text span c="dimmed" lh={1}>
                                        <Users size={14} />
                                    </Text>
                                    <Text size="xs" c="dimmed">
                                        {row.memberCount}
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <Text span c="success" lh={1}>
                                        <ShieldCheck size={14} />
                                    </Text>
                                    <Text size="xs" c="success" fw={600}>
                                        {row.statusCounts.signed}
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <Text span c="accent" lh={1}>
                                        <Clock size={14} />
                                    </Text>
                                    <Text size="xs" c="accent" fw={600}>
                                        {row.statusCounts.pending}
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <Text span c="accent" lh={1}>
                                        <AlertTriangle size={14} />
                                    </Text>
                                    <Text size="xs" c="accent" fw={600}>
                                        {row.statusCounts.expiring_soon}
                                    </Text>
                                </Group>
                                <Group gap={4}>
                                    <Text span c="error" lh={1}>
                                        <XCircle size={14} />
                                    </Text>
                                    <Text size="xs" c="error" fw={600}>
                                        {row.statusCounts.expired}
                                    </Text>
                                </Group>
                            </Group>
                        </Stack>
                    </Card>
                ))}
            </SimpleGrid>
        </Stack>
    );
}
