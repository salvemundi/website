'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Mail,
    ShieldCheck,
    Clock,
    Link2,
    ChevronLeft,
} from 'lucide-react';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Group,
    Modal,
    Paper,
    Stack,
    Tabs,
    Text,
    Textarea,
    Title,
} from '@mantine/core';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import {
    deleteVacancyAction,
    approveSubmissionAction,
    rejectSubmissionAction,
    deleteSubmissionAction,
} from '@/server/actions/vacancies/vacancies-admin.actions';
import type { VacancySubmissionDTO } from '@salvemundi/validations';

interface AdminVacancyRow {
    id: number;
    title: string;
    company: string;
    type: string;
    is_visible: boolean;
    published_at: string;
}

interface AdminVacanciesIslandProps {
    vacancies: AdminVacancyRow[];
    submissions: VacancySubmissionDTO[];
}

type Tab = 'vacatures' | 'aanmeldingen';

function getSubmissionStatusMeta(status: string): { label: string; color?: string } {
    switch (status) {
        case 'pending_verification':
            return { label: 'Wacht op e-mailverificatie', color: 'accent' };
        case 'pending_review':
            return { label: 'Klaar voor beoordeling', color: 'brand' };
        case 'approved':
            return { label: 'Goedgekeurd', color: 'success' };
        case 'rejected':
            return { label: 'Afgewezen', color: 'error' };
        default:
            return { label: status };
    }
}

export default function AdminVacanciesIsland({ vacancies, submissions }: AdminVacanciesIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [tab, setTab] = useState<Tab>('vacatures');
    const [isPending, startTransition] = useTransition();
    const [rejectTarget, setRejectTarget] = useState<VacancySubmissionDTO | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const pendingCount = useMemo(
        () => submissions.filter((s) => s.status === 'pending_review').length,
        [submissions]
    );

    const handleDelete = (id: number, title: string) => {
        if (!window.confirm(`Weet je zeker dat je "${title}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const result = await deleteVacancyAction(id);
            if (result.success) {
                showToast('Vacature verwijderd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Verwijderen mislukt.', 'error');
            }
        });
    };

    const handleApprove = (submission: VacancySubmissionDTO) => {
        startTransition(async () => {
            const result = await approveSubmissionAction(submission.id);
            if (result.success) {
                showToast('Vacature goedgekeurd en gepubliceerd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Goedkeuren mislukt.', 'error');
            }
        });
    };

    const handleDeleteSubmission = (submission: VacancySubmissionDTO) => {
        if (!window.confirm(`Weet je zeker dat je de aanmelding "${submission.title}" wilt verwijderen?`)) return;
        startTransition(async () => {
            const result = await deleteSubmissionAction(submission.id);
            if (result.success) {
                showToast('Aanmelding verwijderd.', 'success');
                router.refresh();
            } else {
                showToast(result.error || 'Verwijderen mislukt.', 'error');
            }
        });
    };

    const handleCopySubmissionLink = async () => {
        const link = `${window.location.origin}/bijbanenbank/plaatsen`;
        await navigator.clipboard.writeText(link);
        showToast('Aanmeldlink gekopieerd naar klembord', 'success');
    };

    const handleReject = () => {
        if (!rejectTarget) return;
        startTransition(async () => {
            const result = await rejectSubmissionAction(rejectTarget.id, rejectReason);
            if (result.success) {
                showToast('Aanmelding afgewezen.', 'success');
                setRejectTarget(null);
                setRejectReason('');
                router.refresh();
            } else {
                showToast(result.error || 'Afwijzen mislukt.', 'error');
            }
        });
    };

    return (
        <Box w="100%">
            <Paper shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Group gap="md">
                            <Button
                                component={Link}
                                href="/beheer"
                                size="sm"
                                leftSection={<ChevronLeft size={16} />}
                            >
                                Terug
                            </Button>
                            <Title order={1} size="h3" c="brand">
                                Bijbanenbank Beheer
                            </Title>
                        </Group>
                        <Group gap="xs" wrap="wrap">
                            <Button
                                type="button"
                                size="sm"
                                leftSection={<Link2 size={16} />}
                                onClick={() => {
                                    void handleCopySubmissionLink();
                                }}
                            >
                                Aanmeldlink kopiëren
                            </Button>
                            <Button
                                component={Link}
                                href="/beheer/bijbanenbank/nieuw"
                                size="sm"
                                leftSection={<Plus size={16} />}
                            >
                                Nieuwe Vacature
                            </Button>
                        </Group>
                    </Group>
                </Container>
            </Paper>

            <Container size="xl" py="lg">
                <Tabs
                    value={tab}
                    onChange={(val) => setTab((val as Tab | null) ?? 'vacatures')}
                >
                    <Tabs.List mb="lg">
                        <Tabs.Tab value="vacatures">
                            Vacatures ({vacancies.length})
                        </Tabs.Tab>
                        <Tabs.Tab value="aanmeldingen">
                            Aanmeldingen {pendingCount > 0 ? `(${pendingCount})` : ''}
                        </Tabs.Tab>
                    </Tabs.List>

                    <Tabs.Panel value="vacatures">
                        <Stack gap="sm">
                            {vacancies.length === 0 ? (
                                <Text py="xl" ta="center" size="sm" c="dimmed">
                                    Nog geen vacatures aangemaakt.
                                </Text>
                            ) : (
                                vacancies.map((vacancy) => (
                                    <Card key={vacancy.id} p="md" shadow="sm">
                                        <Group justify="space-between" wrap="nowrap" gap="md">
                                            <Box miw={0} flex={1}>
                                                <Group gap="xs" mb={4}>
                                                    <Badge
                                                        color={vacancy.type === 'internship' ? 'brand' : 'success'}
                                                        size="xs"
                                                    >
                                                        {vacancy.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                                    </Badge>
                                                    {!vacancy.is_visible && (
                                                        <Badge size="xs">
                                                            Verborgen
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Text fw={700} truncate>
                                                    {vacancy.title}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {vacancy.company}
                                                </Text>
                                            </Box>
                                            <Group gap="xs" wrap="nowrap">
                                                <ActionIcon
                                                    component={Link}
                                                    href={`/beheer/bijbanenbank/${vacancy.id}/bewerken`}
                                                    size="lg"
                                                    title="Bewerken"
                                                    aria-label="Bewerken"
                                                >
                                                    <Pencil size={16} />
                                                </ActionIcon>
                                                <ActionIcon
                                                    type="button"
                                                    color="error"
                                                    size="lg"
                                                    disabled={isPending}
                                                    onClick={() => handleDelete(vacancy.id, vacancy.title)}
                                                    title="Verwijderen"
                                                    aria-label="Verwijderen"
                                                >
                                                    <Trash2 size={16} />
                                                </ActionIcon>
                                            </Group>
                                        </Group>
                                    </Card>
                                ))
                            )}
                        </Stack>
                    </Tabs.Panel>

                    <Tabs.Panel value="aanmeldingen">
                        <Stack gap="sm">
                            {submissions.length === 0 ? (
                                <Text py="xl" ta="center" size="sm" c="dimmed">
                                    Nog geen aanmeldingen ontvangen.
                                </Text>
                            ) : (
                                submissions.map((submission) => {
                                    const statusMeta = getSubmissionStatusMeta(String(submission.status));
                                    return (
                                        <Card key={submission.id} p="md" shadow="sm">
                                            <Stack gap="xs">
                                                <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                                                    <Box miw={0} flex={1}>
                                                        <Group gap="xs" mb={4}>
                                                            <Badge
                                                                color={submission.type === 'internship' ? 'brand' : 'success'}
                                                                size="xs"
                                                            >
                                                                {submission.type === 'internship' ? 'Stage' : 'Bijbaan'}
                                                            </Badge>
                                                            <Badge
                                                                color={statusMeta.color}
                                                                variant={statusMeta.color ? 'light' : 'default'}
                                                                size="xs"
                                                            >
                                                                {statusMeta.label}
                                                            </Badge>
                                                        </Group>
                                                        <Text fw={700}>{submission.title}</Text>
                                                        <Group gap={6} mt={2}>
                                                            <Mail size={12} />
                                                            <Text size="xs" c="dimmed">
                                                                {submission.company} &middot; {submission.contact_email}
                                                            </Text>
                                                        </Group>
                                                        {submission.status === 'rejected' && submission.rejection_reason && (
                                                            <Text size="xs" c="error" mt={4}>
                                                                Reden: {submission.rejection_reason}
                                                            </Text>
                                                        )}
                                                    </Box>

                                                    {submission.status === 'pending_review' && (
                                                        <Group gap="xs">
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                color="success"
                                                                disabled={isPending}
                                                                onClick={() => handleApprove(submission)}
                                                                leftSection={<Check size={14} />}
                                                            >
                                                                Goedkeuren
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                size="xs"
                                                                color="error"
                                                                disabled={isPending}
                                                                onClick={() => {
                                                                    setRejectTarget(submission);
                                                                    setRejectReason('');
                                                                }}
                                                                leftSection={<X size={14} />}
                                                            >
                                                                Afwijzen
                                                            </Button>
                                                        </Group>
                                                    )}

                                                    {submission.status === 'pending_verification' && (
                                                        <Button
                                                            type="button"
                                                            size="xs"
                                                            color="error"
                                                            disabled={isPending}
                                                            onClick={() => handleDeleteSubmission(submission)}
                                                            leftSection={<Trash2 size={14} />}
                                                            title="Verwijderen voordat het e-mailadres is bevestigd"
                                                        >
                                                            Verwijderen
                                                        </Button>
                                                    )}
                                                </Group>

                                                <Group gap="md">
                                                    <Group gap={4}>
                                                        <ShieldCheck size={14} />
                                                        <Text size="xs" c="dimmed">
                                                            {submission.verified_at ? 'E-mail geverifieerd' : 'Nog niet geverifieerd'}
                                                        </Text>
                                                    </Group>
                                                    <Group gap={4}>
                                                        <Clock size={14} />
                                                        <Text size="xs" c="dimmed">
                                                            Aangemeld op {new Date(submission.created_at).toLocaleDateString('nl-NL')}
                                                        </Text>
                                                    </Group>
                                                </Group>
                                            </Stack>
                                        </Card>
                                    );
                                })
                            )}
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Container>

            <Modal
                title="Aanmelding afwijzen"
                opened={!!rejectTarget}
                onClose={() => setRejectTarget(null)}
                size="md"
                centered
            >
                <Stack gap="md">
                    <Text size="sm" c="dimmed">
                        Geef een reden op voor de afwijzing van &quot;{rejectTarget?.title}&quot;. Deze reden wordt per e-mail naar het bedrijf gestuurd.
                    </Text>
                    <Textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={4}
                        autosize
                        minRows={4}
                        placeholder="Bijv. Deze vacature sluit niet aan bij onze doelgroep."
                    />
                    <Group justify="flex-end" gap="xs">
                        <Button
                            type="button"
                            onClick={() => setRejectTarget(null)}
                        >
                            Annuleren
                        </Button>
                        <Button
                            type="button"
                            color="error"
                            disabled={isPending || rejectReason.trim().length === 0}
                            onClick={handleReject}
                        >
                            Afwijzen
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Box>
    );
}
