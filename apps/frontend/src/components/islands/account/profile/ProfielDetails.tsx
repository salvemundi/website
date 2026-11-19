'use client';

import { Mail, Phone, Calendar, Pen, Save, LogOut } from 'lucide-react';
import { ActionIcon, Box, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { Tile, formatForBreak } from './ProfielUI';
import { formatDate } from '@/shared/lib/utils/date';
import { formatPhoneNumber } from '@/lib/utils/phone-utils';
import { authClient } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { UseFormRegister, UseFormHandleSubmit } from 'react-hook-form';
import { safeConsoleError } from '@/server/utils/logger';
import { PhoneInput } from '@/shared/ui/PhoneInput';
import BorrelBarClaimCard from './BorrelBarClaimCard';
import { type BorrelBarClaimStatus } from '@/server/actions/profile/borrelbar-claim.actions';

interface ProfielDetailsProps {
    user?: {
        email?: string | null;
        fontys_email?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
    };
    borrelBarClaimStatus?: BorrelBarClaimStatus;
    isEditingPhoneNumber?: boolean;
    setIsEditingPhoneNumber?: (val: boolean) => void;
    registerPhone: UseFormRegister<{ phone_number?: string | null }>;
    handleSubmitPhone: UseFormHandleSubmit<{ phone_number?: string | null }>;
    onSavePhone?: (data: { phone_number?: string | null }) => void;
    isPending?: boolean;
}

export default function ProfielDetails({
    user = {},
    borrelBarClaimStatus,
    isEditingPhoneNumber = false,
    setIsEditingPhoneNumber = () => { },
    registerPhone,
    handleSubmitPhone,
    onSavePhone = () => { },
    isPending = false
}: ProfielDetailsProps) {
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await authClient.signOut();
            router.push('/?noAuto=true');
            router.refresh();
        } catch (error) {
            safeConsoleError('[ProfielDetails.tsx][ProfielDetails] ', error);
        }
    };

    const logoutButton = (
        <Button
            type="button"
            variant="light"
            color="error"
            size="xs"
            leftSection={<LogOut size={14} />}
            onClick={() => {
                void handleLogout();
            }}
        >
            Uitloggen
        </Button>
    );

    return (
        <Tile
            title="Mijn gegevens"
            icon={<Mail size={20} />}
            actions={logoutButton}
        >
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                <Stack gap={6}>
                    <Text size="xs" fw={900} tt="uppercase" c="brand" pl={4}>
                        E-mailadres
                    </Text>
                    <Paper p="md" withBorder mih={68}>
                        <Group gap="md" wrap="nowrap" h="100%">
                            <Text span c="brand" lh={1}>
                                <Mail size={20} />
                            </Text>
                            <Text size="sm" fw={700} style={{ wordBreak: 'break-word', minWidth: 0 }}>
                                {formatForBreak(user.email) || 'Geen email'}
                            </Text>
                        </Group>
                    </Paper>
                </Stack>

                {user.fontys_email && (
                    <Stack gap={6}>
                        <Text size="xs" fw={900} tt="uppercase" c="brand" pl={4}>
                            Fontys e-mail
                        </Text>
                        <Paper p="md" withBorder mih={68}>
                            <Group gap="md" wrap="nowrap" h="100%">
                                <Text span c="brand" lh={1}>
                                    <Mail size={20} />
                                </Text>
                                <Text size="sm" fw={700} style={{ wordBreak: 'break-word', minWidth: 0 }}>
                                    {formatForBreak(user.fontys_email)}
                                </Text>
                            </Group>
                        </Paper>
                    </Stack>
                )}

                <Stack gap={6}>
                    <Group justify="space-between" align="center" pl={4} h={20}>
                        <Text size="xs" fw={900} tt="uppercase" c="brand">
                            Telefoonnummer
                        </Text>
                        {!isEditingPhoneNumber && (
                            <ActionIcon
                                type="button"
                                variant="subtle"
                                size="sm"
                                onClick={() => setIsEditingPhoneNumber(true)}
                                aria-label="Telefoonnummer bewerken"
                            >
                                <Pen size={14} />
                            </ActionIcon>
                        )}
                    </Group>
                    <Paper p="md" withBorder mih={68}>
                        <Group gap="md" wrap="nowrap" h="100%">
                            <Text span c="brand" lh={1}>
                                <Phone size={20} />
                            </Text>
                            {isEditingPhoneNumber ? (
                                <form
                                    onSubmit={(e) => {
                                        void handleSubmitPhone(onSavePhone)(e);
                                    }}
                                    style={{ flex: 1, minWidth: 0 }}
                                    autoComplete="off"
                                >
                                    <Group gap="xs" wrap="nowrap" align="flex-start">
                                        <Box flex={1} miw={0}>
                                            <PhoneInput {...registerPhone('phone_number')} />
                                        </Box>
                                        <ActionIcon
                                            type="submit"
                                            variant="filled"
                                            size="lg"
                                            loading={isPending}
                                            aria-label="Telefoonnummer opslaan"
                                        >
                                            <Save size={16} />
                                        </ActionIcon>
                                    </Group>
                                </form>
                            ) : (
                                <Text size="sm" fw={700}>
                                    {formatPhoneNumber(user.phone_number) || 'Niet ingesteld'}
                                </Text>
                            )}
                        </Group>
                    </Paper>
                </Stack>

                <Stack gap={6}>
                    <Text size="xs" fw={900} tt="uppercase" c="brand" pl={4}>
                        Geboortedatum
                    </Text>
                    <Paper p="md" withBorder mih={68}>
                        <Group gap="md" wrap="nowrap" h="100%">
                            <Text span c="brand" lh={1}>
                                <Calendar size={20} />
                            </Text>
                            <Text size="sm" fw={700}>
                                {formatDate(user.date_of_birth, 'd MMMM yyyy')}
                            </Text>
                        </Group>
                    </Paper>
                </Stack>

                <BorrelBarClaimCard initialStatus={borrelBarClaimStatus} />
            </SimpleGrid>
        </Tile>
    );
}
