'use client';

import { useState, useOptimistic, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Trash, X } from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Container,
    Divider,
    Grid,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import { updateActivityAction, deleteActivity } from '@/server/actions/events/activiteiten/activiteiten-write.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { type BeheerActivity, type Committee } from '@salvemundi/validations';
import { useActivityForm, type ActivityStatus } from '@/hooks/use-activity-form';
import {
    GeneralInfoSection,
    PlanningLocationSection,
    CapacityCostsSection,
    BannerSection,
    StatusSection
} from '@/components/admin/activities/ActivityFormSections';

interface ActionState {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: { [key: string]: unknown };
}

interface ActiviteitBewerkenIslandProps {
    event: BeheerActivity;
    committees?: Committee[];
}

export default function ActiviteitBewerkenIsland({
    event,
    committees = []
}: ActiviteitBewerkenIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();

    const {
        status, setStatus,
        onlyMembers, setOnlyMembers,
        contactEmail, setContactEmail,
        imageFile,
        removeExistingImage,
        imagePreview,
        fileInputRef,
        handleImageChange,
        handleRemoveImage,
        handleCommitteeChange
    } = useActivityForm({
        initialStatus: (event.status === 'draft' ? 'draft' : (event.publish_date ? 'scheduled' : 'published')) as ActivityStatus,
        initialOnlyMembers: !!event.only_members,
        initialContactEmail: event.contact || '',
        initialImage: event.image,
        committees
    });

    const [state, formAction, isPending] = useActionState<ActionState, FormData>(async (prevState: ActionState, formData: FormData) => {
        if (imageFile) formData.append('imageFile', imageFile);
        if (removeExistingImage) formData.append('removeImage', 'true');
        formData.set('status', status);
        formData.set('only_members', onlyMembers ? 'on' : 'off');

        const res = await updateActivityAction(event.id, prevState, formData);
        if (res.success) {
            showToast('Activiteit succesvol bijgewerkt!', 'success');
            router.refresh();
        } else {
            showToast(res.error || 'Er is een fout opgetreden', 'error');
        }
        return res;
    }, { success: false });

    useEffect(() => {
        if (state.initialData) {
            const data = state.initialData;
            if (data.status && typeof data.status === 'string') setStatus(data.status as ActivityStatus);
            if (data.only_members !== undefined) setOnlyMembers(data.only_members === 'on' || data.only_members === true);
            if (data.contact && typeof data.contact === 'string') setContactEmail(data.contact);
        }
    }, [state.initialData, setStatus, setOnlyMembers, setContactEmail]);

    const [optimisticSaving] = useOptimistic(isPending);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Weet je zeker dat je "${event.name}" wilt verwijderen?`)) return;
        setIsDeleting(true);
        try {
            const res = await deleteActivity(event.id);
            if (res.success) {
                showToast('Activiteit succesvol verwijderd', 'success');
                router.push('/beheer/activiteiten');
            } else {
                showToast(res.error || 'Fout bij verwijderen', 'error');
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const initialData = (state.initialData || event) as { [key: string]: unknown };

    const handleValidatedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const MAX_SIZE_MB = 10;

        if (file && file.size > MAX_SIZE_MB * 1024 * 1024) {
            showToast(`Bestand is te groot. Maximaal ${MAX_SIZE_MB}MB toegestaan.`, 'error');
            e.target.value = '';
            return;
        }

        handleImageChange(e);
    };

    const actionButtons = (
        <Stack gap="sm">
            <Button
                type="submit"
                size="md"
                fullWidth
                disabled={optimisticSaving}
                loading={optimisticSaving}
                leftSection={<Save size={16} />}
            >
                {optimisticSaving ? 'Opslaan...' : 'Wijzigingen opslaan'}
            </Button>

            <Button
                type="button"
                size="md"
                fullWidth
                onClick={() => router.back()}
                leftSection={<X size={16} />}
            >
                Annuleren
            </Button>

            <Divider my="xs" />

            <Button
                type="button"
                color="error"
                size="md"
                fullWidth
                onClick={() => { void handleDelete(); }}
                disabled={isDeleting || optimisticSaving}
                loading={isDeleting}
                leftSection={<Trash size={16} />}
            >
                Activiteit verwijderen
            </Button>
        </Stack>
    );

    return (
        <Container size="xl" py="xl" pb={80}>
            <Stack gap="xl">
                <Group gap="md" align="center">
                    <ActionIcon
                        component={Link}
                        href="/beheer/activiteiten"
                        size="lg"
                        aria-label="Terug"
                    >
                        <ChevronLeft size={18} />
                    </ActionIcon>
                    <Stack gap={2}>
                        <Title order={1} size="h2" c="brand">
                            Activiteit bewerken
                        </Title>
                        <Text size="sm" c="dimmed">
                            {`Wijzig "${event.name}"`}
                        </Text>
                    </Stack>
                </Group>

                <form action={formAction}>
                    <Stack gap="lg">
                        <Grid gap="lg" align="flex-start">
                            <Grid.Col span={{ base: 12, lg: 8 }}>
                                <GeneralInfoSection initialData={initialData} formErrors={state.fieldErrors} />
                            </Grid.Col>

                            <Grid.Col span={{ base: 12, lg: 4 }} pos={{ lg: 'sticky' }} top={{ lg: 32 }}>
                                <Stack gap="lg">
                                    <BannerSection
                                        imagePreview={imagePreview}
                                        onUploadClick={() => fileInputRef.current?.click()}
                                        onRemoveClick={handleRemoveImage}
                                        fileInputRef={fileInputRef}
                                        onFileChange={handleValidatedImageChange}
                                    />
                                    <StatusSection
                                        status={status}
                                        onStatusChange={(val) => setStatus(val as ActivityStatus)}
                                        initialData={initialData}
                                    />
                                    <Box visibleFrom="lg">{actionButtons}</Box>
                                </Stack>
                            </Grid.Col>
                        </Grid>

                        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
                            <PlanningLocationSection initialData={initialData} formErrors={state.fieldErrors} />
                            <CapacityCostsSection
                                initialData={initialData}
                                committees={committees}
                                contactEmail={contactEmail}
                                onContactEmailChange={setContactEmail}
                                onCommitteeChange={handleCommitteeChange}
                                onlyMembers={onlyMembers}
                                onOnlyMembersChange={setOnlyMembers}
                                formErrors={state.fieldErrors}
                            />
                        </SimpleGrid>

                        <Box hiddenFrom="lg" pt="sm">
                            {actionButtons}
                        </Box>
                    </Stack>
                </form>
            </Stack>
        </Container>
    );
}
