'use client';

import { useState } from 'react';
import {
    Shield,
    ShieldAlert,
    Plus,
    Award,
    Trash,
    CalendarPlus,
    RefreshCw,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Box,
    Button,
    Card,
    Group,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { cleanName } from './LedenSharedComponents';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface Member {
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    entra_id?: string | null;
}

interface CommitteeMembership {
    id: string;
    is_leader: boolean;
    committee_id: {
        id: string;
        name: string;
        azure_group_id?: string | null;
    };
}

interface Committee {
    id: string;
    name: string;
    azure_group_id?: string | null | undefined;
}

interface Props {
    member: Member;
    optimisticMemberships: CommitteeMembership[];
    availableCommittees: Committee[];
    onProvision: () => Promise<{ success: boolean; message: string } | null>;
    onMembershipChange: (groupId: string, action: 'add' | 'remove', name: string) => Promise<void>;
    onRenew: (months: number) => Promise<{ success: boolean; message: string } | null>;
    onSync: () => Promise<{ success: boolean; message: string } | null>;
    isActionInProgress: string | null;
}

export default function MemberAdminTab({
    member,
    optimisticMemberships,
    availableCommittees,
    onProvision,
    onMembershipChange,
    onRenew,
    onSync,
    isActionInProgress,
}: Props) {
    const { showToast } = useAdminToast();
    const [provisioningLoading, setProvisioningLoading] = useState(false);
    const [renewMonths, setRenewMonths] = useState(12);
    const [renewLoading, setRenewLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    const handleProvision = async () => {
        setProvisioningLoading(true);
        const res = await onProvision();
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setProvisioningLoading(false);
    };

    const handleRenew = async () => {
        setRenewLoading(true);
        const res = await onRenew(renewMonths);
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setRenewLoading(false);
    };

    const handleSync = async () => {
        setSyncLoading(true);
        const res = await onSync();
        if (res) {
            showToast(res.message, res.success ? 'success' : 'error');
        }
        setSyncLoading(false);
    };

    return (
        <Stack gap="lg">
            {!member.entra_id && (
                <Card p="xl" shadow="sm" style={{ borderLeft: '6px solid var(--mantine-color-accent-filled)' }}>
                    <Stack gap="lg">
                        <Group gap="md">
                            <ThemeIcon size="lg" color="accent">
                                <ShieldAlert size={22} />
                            </ThemeIcon>
                            <Box>
                                <Title order={3} size="h4">
                                    Azure Account Ontbreekt
                                </Title>
                                <Text size="xs" c="dimmed">
                                    Dit lid is nog niet bekend in Microsoft Entra ID.
                                </Text>
                            </Box>
                        </Group>

                        <Alert color="accent">
                            Door een account aan te maken krijgt het lid een salvemundi.nl e-mailadres en toegang tot Office 365. Het tijdelijke wachtwoord wordt direct naar hun persoonlijke e-mailadres gestuurd.
                        </Alert>

                        <Button
                            type="button"
                            w={{ base: '100%', sm: 'fit-content' }}
                            loading={provisioningLoading}
                            leftSection={<Plus size={16} />}
                            onClick={() => {
                                void handleProvision();
                            }}
                        >
                            Azure AD Account Aanmaken
                        </Button>
                    </Stack>
                </Card>
            )}

            <Card p="xl" shadow="sm">
                <Stack gap="xl">
                    <Group justify="space-between" wrap="nowrap">
                        <Box>
                            <Title order={3} size="h4">
                                Azure Groepsbeheer
                            </Title>
                            <Text size="xs" c="dimmed">
                                Lidmaatschappen direct in Azure AD aanpassen
                            </Text>
                        </Box>
                        <ThemeIcon size="lg">
                            <Shield size={22} />
                        </ThemeIcon>
                    </Group>

                    <Stack gap="sm">
                        <Text size="xs" fw={600} c="dimmed">
                            Huidige Lidmaatschappen
                        </Text>
                        {optimisticMemberships.filter((m) => m.committee_id.azure_group_id).length === 0 ? (
                            <Text size="xs" c="dimmed" fs="italic">
                                Geen Azure-gekoppelde commissies.
                            </Text>
                        ) : (
                            <Stack gap="xs">
                                {optimisticMemberships
                                    .filter((m) => m.committee_id.azure_group_id)
                                    .map((m) => {
                                        const groupId = m.committee_id.azure_group_id;
                                        if (!groupId) return null;
                                        const isLeader =
                                            m.is_leader &&
                                            m.committee_id.azure_group_id !== COMMITTEES.BESTUUR;
                                        return (
                                            <Paper key={m.id} p="md" withBorder>
                                                <Group justify="space-between" wrap="nowrap">
                                                    <Group gap="sm" wrap="nowrap">
                                                        <Text span c={isLeader ? 'brand' : 'dimmed'} lh={1}>
                                                            <Award size={18} />
                                                        </Text>
                                                        <Text size="sm" fw={600}>
                                                            {cleanName(m.committee_id.name)}
                                                        </Text>
                                                    </Group>
                                                    <ActionIcon
                                                        type="button"
                                                        color="error"
                                                        onClick={() => {
                                                            void onMembershipChange(
                                                                groupId,
                                                                'remove',
                                                                m.committee_id.name
                                                            );
                                                        }}
                                                        loading={isActionInProgress === `remove-${groupId}`}
                                                        aria-label={`Verwijder uit ${cleanName(m.committee_id.name)}`}
                                                    >
                                                        <Trash size={16} />
                                                    </ActionIcon>
                                                </Group>
                                            </Paper>
                                        );
                                    })}
                            </Stack>
                        )}
                    </Stack>

                    <Stack gap="sm">
                        <Text size="xs" fw={600} c="dimmed">
                            Toevoegen aan Azure Groep
                        </Text>
                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                            {availableCommittees.map((c) => (
                                <Button
                                    key={c.id}
                                    type="button"
                                    h="auto"
                                    py="sm"
                                    px="md"
                                    justify="space-between"
                                    disabled={isActionInProgress === `add-${c.azure_group_id}`}
                                    onClick={() => {
                                        if (c.azure_group_id) {
                                            void onMembershipChange(c.azure_group_id, 'add', c.name);
                                        }
                                    }}
                                    rightSection={
                                        isActionInProgress === `add-${c.azure_group_id}` ? (
                                            <Loader size={14} />
                                        ) : (
                                            <Plus size={16} />
                                        )
                                    }
                                >
                                    <Box ta="left" miw={0}>
                                        <Text size="xs" fw={600} truncate>
                                            {cleanName(c.name)}
                                        </Text>
                                        <Text size="xs" opacity={0.8}>
                                            Azure ID: {c.azure_group_id?.substring(0, 8)}...
                                        </Text>
                                    </Box>
                                </Button>
                            ))}
                        </SimpleGrid>
                    </Stack>
                </Stack>
            </Card>

            <Card p="xl" shadow="sm">
                <Stack gap="lg">
                    <Group gap="md">
                        <ThemeIcon size="lg" color="success">
                            <CalendarPlus size={22} />
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">
                                Lidmaatschap Verlengen
                            </Title>
                            <Text size="xs" c="dimmed">
                                Handmatig verlengen (bv. bij contante betaling)
                            </Text>
                        </Box>
                    </Group>

                    <Group gap="sm" wrap="wrap">
                        <Text size="xs" fw={600} c="dimmed">
                            Verlengen met:
                        </Text>
                        <Group gap="xs">
                            {[1, 6, 12].map((m) => (
                                <Button
                                    key={m}
                                    type="button"
                                    size="xs"
                                    variant={renewMonths === m ? 'filled' : 'default'}
                                    onClick={() => setRenewMonths(m)}
                                >
                                    {m} maand{m > 1 ? 'en' : ''}
                                </Button>
                            ))}
                        </Group>
                        <Button
                            type="button"
                            color="success"
                            loading={renewLoading}
                            leftSection={<CalendarPlus size={16} />}
                            onClick={() => {
                                void handleRenew();
                            }}
                        >
                            Verlengen
                        </Button>
                    </Group>
                </Stack>
            </Card>

            {member.entra_id && (
                <Card p="xl" shadow="sm">
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Box>
                            <Title order={3} size="h5">
                                Azure AD Synchronisatie
                            </Title>
                            <Text size="xs" c="dimmed">
                                Forceer een directe sync van dit lid met Azure AD.
                            </Text>
                        </Box>
                        <Button
                            type="button"
                            w={{ base: '100%', sm: 'auto' }}
                            loading={syncLoading}
                            leftSection={<RefreshCw size={16} />}
                            onClick={() => {
                                void handleSync();
                            }}
                        >
                            Synchroniseer
                        </Button>
                    </Group>
                </Card>
            )}
        </Stack>
    );
}
