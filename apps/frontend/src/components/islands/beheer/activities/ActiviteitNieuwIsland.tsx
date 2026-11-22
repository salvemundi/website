'use client';

import { useOptimistic, useActionState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, X } from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Container,
    Grid,
    Group,
    SimpleGrid,
    Stack,
    Title,
} from '@mantine/core';
import { createActivityAction } from '@/server/actions/events/activiteiten/activiteiten-write.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { useActivityForm, type ActivityStatus } from '@/hooks/use-activity-form';
import {
    GeneralInfoSection,
    PlanningLocationSection,
    CapacityCostsSection,
    BannerSection,
    StatusSection
} from '@/components/admin/activities/ActivityFormSections';

interface Committee {
    id: number;
    name: string;
    email?: string | null;
}

interface ActionState {
    success: boolean;
    id?: number;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    initialData?: { [key: string]: unknown };
}

interface ActiviteitNieuwIslandProps {
    committees?: Committee[];
}

export default function ActiviteitNieuwIsland({
    committees = []
}: ActiviteitNieuwIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();

    const {
        status, setStatus,
        onlyMembers, setOnlyMembers,
        contactEmail, setContactEmail,
        imageFile,
        imagePreview,
        fileInputRef,
        handleImageChange,
        handleRemoveImage,
        handleCommitteeChange
    } = useActivityForm({
        committees
    });

    const [state, formAction, isPending] = useActionState<ActionState, FormData>(
        async (prevState: ActionState, formData: FormData) => {
            if (imageFile) formData.append('imageFile', imageFile);
            formData.set('status', status);
            formData.set('only_members', onlyMembers ? 'on' : 'off');

            const res = await createActivityAction(prevState, formData);
            return res as ActionState;
        },
        { success: false }
    );

    useEffect(() => {
        if (state.success && state.id) {
            showToast('Activiteit succesvol aangemaakt!', 'success');
            const timer = setTimeout(() => {
                router.push(`/beheer/activiteiten/${state.id}/bewerken`);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (state.error) {
            showToast(state.error, 'error');

            if (state.initialData) {
                const data = state.initialData;
                if (typeof data.status === 'string') setStatus(data.status as ActivityStatus);
                if (data.only_members !== undefined) setOnlyMembers(data.only_members === 'on' || data.only_members === true);
                if (typeof data.contact === 'string') setContactEmail(data.contact);
            }
        }
    }, [state, showToast, router, setStatus, setOnlyMembers, setContactEmail]);

    const [optimisticSaving] = useOptimistic(isPending);
    const initialData = state.initialData as { [key: string]: unknown } | undefined;

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
                {optimisticSaving ? 'Bezig...' : 'Activiteit aanmaken'}
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
                    <Title order={1} size="h2" c="brand">
                        Nieuwe activiteit
                    </Title>
                </Group>

                <Box component="form" action={formAction}>
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
                </Box>
            </Stack>
        </Container>
    );
}
