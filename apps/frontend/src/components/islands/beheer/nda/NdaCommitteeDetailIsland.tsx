'use client';

import { useState } from 'react';
import {
    Upload,
    FileText,
    Send,
    RefreshCw,
    CheckCircle2,
    Eye,
    Bell,
    MapPin,
} from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    FileButton,
    Group,
    Loader,
    Stack,
    Table,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import type {
    NdaCommitteeDetail,
    NdaMemberStatusRow,
    DerivedNdaStatus,
} from '@/server/queries/nda/beheer-nda.queries';
import {
    uploadNdaTemplate,
    confirmNdaTemplateReady,
} from '@/server/actions/beheer/nda/beheer-nda-templates.actions';
import {
    sendNdaToCommitteeMembers,
    resendNdaInvite,
    recordHistoricalNdaSignature,
    sendRenewalReminderToMember,
} from '@/server/actions/beheer/nda/beheer-nda-signatures.actions';
import NdaSignatureLayoutEditor from '@/components/islands/beheer/nda/NdaSignatureLayoutEditor';

interface Props {
    detail: NdaCommitteeDetail;
    isSecretary: boolean;
}

function getStatusBadgeMeta(status: DerivedNdaStatus): { label: string; color?: string } {
    switch (status) {
        case 'none':
            return { label: 'Nog niet geregistreerd' };
        case 'pending':
            return { label: 'Verzonden', color: 'accent' };
        case 'signed':
            return { label: 'Getekend', color: 'success' };
        case 'expiring_soon':
            return { label: 'Verloopt binnenkort', color: 'accent' };
        case 'expired':
            return { label: 'Verlopen', color: 'error' };
    }
}

function formatDate(iso: string | null): string {
    if (!iso) return '-';
    return new Date(iso).toLocaleDateString('nl-NL');
}

function parseDutchDate(input: string): string | null {
    const trimmed = input.trim();
    const dmy = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(trimmed);
    if (dmy) {
        const [, d, m, y] = dmy;
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
    return ymd ? trimmed : null;
}

export default function NdaCommitteeDetailIsland({ detail, isSecretary }: Props) {
    const { committee, template, members } = detail;

    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<string | null>(null);
    const [resendingId, setResendingId] = useState<number | null>(null);
    const [historicalDates, setHistoricalDates] = useState<Map<string, string>>(() => new Map());
    const [savingHistoricalFor, setSavingHistoricalFor] = useState<string | null>(null);
    const [reminderId, setReminderId] = useState<number | null>(null);
    const [reminderError, setReminderError] = useState<string | null>(null);
    const [editingLayout, setEditingLayout] = useState(false);

    const handleUpload = async (file: File | null) => {
        if (!file) return;

        setUploading(true);
        setUploadError(null);
        const formData = new FormData();
        formData.append('document', file);
        const result = await uploadNdaTemplate(committee.id, formData);
        setUploading(false);
        if (!result.success) {
            setUploadError(result.error);
            return;
        }
        window.location.reload();
    };

    const handleConfirmReady = async () => {
        if (!template) return;
        setConfirming(true);
        setConfirmError(null);
        const result = await confirmNdaTemplateReady(template.id);
        setConfirming(false);
        if (!result.success) {
            setConfirmError(result.error);
            return;
        }
        window.location.reload();
    };

    const handleSendToMembers = async () => {
        if (!template) return;
        setSending(true);
        setSendResult(null);
        const result = await sendNdaToCommitteeMembers(template.id);
        setSending(false);
        setSendResult(
            result.success
                ? `Verstuurd naar ${result.sentCount} lid/leden.`
                : result.error ?? 'Versturen mislukt'
        );
        if (result.success) window.location.reload();
    };

    const handleResend = async (signatureId: number) => {
        setResendingId(signatureId);
        await resendNdaInvite(signatureId);
        setResendingId(null);
    };

    const handleSendReminder = async (signatureId: number) => {
        setReminderId(signatureId);
        setReminderError(null);
        const result = await sendRenewalReminderToMember(signatureId);
        setReminderId(null);
        if (!result.success) {
            setReminderError(result.error ?? 'Versturen mislukt');
            return;
        }
        window.location.reload();
    };

    const handleSaveHistorical = async (userId: string) => {
        const date = historicalDates.get(userId);
        if (!date) return;
        setSavingHistoricalFor(userId);
        const result = await recordHistoricalNdaSignature(committee.id, userId, date);
        setSavingHistoricalFor(null);
        if (result.success) window.location.reload();
    };

    return (
        <Stack gap="xl">
            <Card p="lg" shadow="sm">
                <Stack gap="md">
                    <Title order={3} size="h5" c="dimmed">
                        NDA-document ({new Date().getFullYear()})
                    </Title>
                    <Group align="flex-start" gap="lg" wrap="wrap">
                        <ThemeIcon
                            size={64}
                            variant={template?.document ? 'light' : 'default'}
                            color={template?.document ? 'brand' : undefined}
                        >
                            {uploading ? <Loader size="sm" /> : <FileText size={24} />}
                        </ThemeIcon>
                        <Stack gap="xs" align="flex-start">
                            {(!template || template.status === 'draft') && (
                                <FileButton
                                    onChange={(file) => {
                                        void handleUpload(file);
                                    }}
                                    accept="application/pdf,.pdf"
                                >
                                    {(props) => (
                                        <Button
                                            {...props}
                                            leftSection={<Upload size={16} />}
                                            loading={uploading}
                                        >
                                            {template?.document ? 'Ander bestand kiezen' : 'NDA-PDF uploaden'}
                                        </Button>
                                    )}
                                </FileButton>
                            )}
                            {template?.document && (
                                <Anchor
                                    href={`/api/assets/${template.document}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    size="xs"
                                    fw={600}
                                >
                                    Geüploade NDA bekijken
                                </Anchor>
                            )}
                            {uploadError && (
                                <Alert color="error" py="xs">
                                    {uploadError}
                                </Alert>
                            )}
                            {!template?.document && !uploadError && (
                                <Text size="xs" c="dimmed" maw={380}>
                                    Upload de NDA-PDF zoals ondertekend door de secretaris en voorzitter — het document moet de handtekeningen van beiden al bevatten.
                                </Text>
                            )}
                        </Stack>
                    </Group>
                </Stack>
            </Card>

            {template?.document && (
                <Card p="lg" shadow="sm">
                    <Stack gap="md">
                        <Group justify="space-between">
                            <Title order={3} size="h5" c="dimmed">
                                Handtekeningplek instellen
                            </Title>
                            {template.signatureLayout && !editingLayout && (
                                <Button
                                    type="button"
                                    size="xs"
                                    onClick={() => setEditingLayout(true)}
                                >
                                    Opnieuw instellen
                                </Button>
                            )}
                        </Group>
                        {template.signatureLayout && !editingLayout ? (
                            <Group gap="xs">
                                <Text span c="success" lh={1}>
                                    <MapPin size={16} />
                                </Text>
                                <Text size="sm" c="dimmed">
                                    De plek voor locatie, datum, naam en handtekening van het commissielid is ingesteld.
                                </Text>
                            </Group>
                        ) : (
                            <NdaSignatureLayoutEditor
                                templateId={template.id}
                                documentFileId={template.document}
                                initialLayout={template.signatureLayout}
                                onSaved={() => window.location.reload()}
                            />
                        )}
                    </Stack>
                </Card>
            )}

            {template?.status === 'draft' && template.document && template.signatureLayout && (
                <Card p="lg" shadow="sm">
                    <Stack gap="md">
                        <Title order={3} size="h5" c="dimmed">
                            Bevestigen en klaarzetten
                        </Title>
                        {isSecretary ? (
                            <Stack gap="md" maw={460}>
                                <Text size="sm" c="dimmed">
                                    Controleer of het geüploade document de handtekeningen van de secretaris en de voorzitter bevat, en bevestig dan dat de NDA klaar is om naar de leden verstuurd te worden.
                                </Text>
                                {confirmError && (
                                    <Alert color="error" py="xs">
                                        {confirmError}
                                    </Alert>
                                )}
                                <Button
                                    type="button"
                                    onClick={() => {
                                        void handleConfirmReady();
                                    }}
                                    loading={confirming}
                                    leftSection={<CheckCircle2 size={16} />}
                                    w="fit-content"
                                >
                                    Bevestigen: klaar om te versturen
                                </Button>
                            </Stack>
                        ) : (
                            <Text size="sm" c="dimmed">
                                Wacht op bevestiging door de aangewezen secretaris.
                            </Text>
                        )}
                    </Stack>
                </Card>
            )}

            {template?.status === 'signed' && (
                <Card p="lg" shadow="sm">
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Text size="sm" c="dimmed">
                            Bevestigd op {formatDate(template.secretarySignedAt)}. Verstuur nu naar de leden van {committee.name}.
                        </Text>
                        <Button
                            type="button"
                            onClick={() => {
                                void handleSendToMembers();
                            }}
                            loading={sending}
                            leftSection={<Send size={16} />}
                        >
                            Verstuur naar alle leden
                        </Button>
                    </Group>
                </Card>
            )}

            {sendResult && (
                <Text size="sm" c="dimmed">
                    {sendResult}
                </Text>
            )}
            {reminderError && (
                <Alert color="error">
                    {reminderError}
                </Alert>
            )}

            <Card p={0} shadow="sm" style={{ overflow: 'hidden' }}>
                <Table.ScrollContainer minWidth={720}>
                    <Table highlightOnHover verticalSpacing="md" horizontalSpacing="md">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Naam</Table.Th>
                                <Table.Th>Status</Table.Th>
                                <Table.Th>Verzonden</Table.Th>
                                <Table.Th>Getekend</Table.Th>
                                <Table.Th>Verloopt</Table.Th>
                                <Table.Th>Actie</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {members.map((member: NdaMemberStatusRow) => {
                                const badge = getStatusBadgeMeta(member.status);
                                return (
                                    <Table.Tr key={member.userId}>
                                        <Table.Td>
                                            <Box>
                                                <Text size="sm" fw={600}>
                                                    {member.name}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {member.email}
                                                </Text>
                                            </Box>
                                        </Table.Td>
                                        <Table.Td>
                                            <Badge
                                                size="sm"
                                                variant={badge.color ? 'light' : 'default'}
                                                color={badge.color}
                                            >
                                                {badge.label}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {formatDate(member.sentAt)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {formatDate(member.signedAt)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {formatDate(member.expiresAt)}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Stack gap="xs" align="flex-start">
                                                {member.status === 'pending' && member.signatureId && (
                                                    <ActionIcon
                                                        type="button"
                                                        size="lg"
                                                        onClick={() => {
                                                            void handleResend(member.signatureId as number);
                                                        }}
                                                        loading={resendingId === member.signatureId}
                                                        title="Opnieuw versturen"
                                                        aria-label="Opnieuw versturen"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </ActionIcon>
                                                )}
                                                {(member.status === 'signed' ||
                                                    member.status === 'expiring_soon' ||
                                                    member.status === 'expired') &&
                                                    member.signedDocument && (
                                                        <Anchor
                                                            href={`/api/assets/${member.signedDocument}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            size="xs"
                                                            fw={600}
                                                        >
                                                            <Group gap={6} wrap="nowrap">
                                                                <Eye size={14} />
                                                                <Text span inherit>Bekijken</Text>
                                                            </Group>
                                                        </Anchor>
                                                    )}
                                                {member.status === 'expired' && member.signatureId && (
                                                    <Button
                                                        type="button"
                                                        size="xs"
                                                        onClick={() => {
                                                            void handleSendReminder(member.signatureId as number);
                                                        }}
                                                        loading={reminderId === member.signatureId}
                                                        leftSection={<Bell size={14} />}
                                                    >
                                                        Stuur herinnering
                                                    </Button>
                                                )}
                                                {member.status === 'none' && (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <DateInput
                                                            value={historicalDates.get(member.userId) ?? null}
                                                            onChange={(val) => {
                                                                setHistoricalDates((prev) =>
                                                                    new Map(prev).set(member.userId, val ?? '')
                                                                );
                                                            }}
                                                            valueFormat="DD-MM-YYYY"
                                                            dateParser={parseDutchDate}
                                                            placeholder="dd-mm-jjjj"
                                                            size="xs"
                                                            w={140}
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            disabled={!historicalDates.get(member.userId)}
                                                            loading={savingHistoricalFor === member.userId}
                                                            onClick={() => {
                                                                void handleSaveHistorical(member.userId);
                                                            }}
                                                        >
                                                            Eerder getekend op
                                                        </Button>
                                                    </Group>
                                                )}
                                            </Stack>
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })}
                        </Table.Tbody>
                    </Table>
                </Table.ScrollContainer>
            </Card>
        </Stack>
    );
}
