'use client';

import { useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    Briefcase,
    Mail,
    Building2,
    MapPin,
    Image as ImageIcon,
    FileText,
    X,
    ChevronLeft,
} from 'lucide-react';
import {
    ActionIcon,
    Box,
    Button,
    Card,
    Checkbox,
    Container,
    Divider,
    Group,
    Input,
    NativeSelect,
    Paper,
    SimpleGrid,
    Stack,
    Switch,
    TagsInput,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor';
import MediaAsset from '@/components/ui/media/MediaAsset';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { createVacancyAction, updateVacancyAction } from '@/server/actions/vacancies/vacancies-admin.actions';
import { vacancyAdminSchema, type VacancyAdminForm, ICT_DIRECTIONS } from '@salvemundi/validations';

interface VacancyAdminFormIslandProps {
    vacancyId?: number;
    initialData?: Partial<VacancyAdminForm> & { image?: string | null; document?: string | null };
}

export default function VacancyAdminFormIsland({ vacancyId, initialData }: VacancyAdminFormIslandProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const isEditing = typeof vacancyId === 'number';

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [removeExistingImage, setRemoveExistingImage] = useState(false);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [removeExistingDocument, setRemoveExistingDocument] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const documentInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        control,
        watch,
        handleSubmit,
        formState: { errors },
    } = useForm<VacancyAdminForm>({
        resolver: zodResolver(vacancyAdminSchema),
        defaultValues: {
            title: initialData?.title ?? '',
            company: initialData?.company ?? '',
            description: initialData?.description ?? '',
            type: initialData?.type ?? 'parttime',
            contact_email: initialData?.contact_email ?? '',
            contact_phone: initialData?.contact_phone ?? '',
            contact_website: initialData?.contact_website ?? '',
            location: initialData?.location ?? '',
            salary: initialData?.salary ?? '',
            employment_type: initialData?.employment_type ?? '',
            working_hours: initialData?.working_hours ?? '',
            directions: initialData?.directions ?? [],
            skills: initialData?.skills ?? [],
            is_visible: initialData?.is_visible ?? true,
        },
    });

    const type = watch('type');

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
        if (file) setRemoveExistingImage(false);
    };

    const onSubmit = async (data: VacancyAdminForm) => {
        const formData = new FormData();
        formData.set('title', data.title);
        formData.set('company', data.company);
        formData.set('description', data.description);
        formData.set('type', data.type);
        formData.set('contact_email', data.contact_email);
        formData.set('contact_phone', data.contact_phone || '');
        formData.set('contact_website', data.contact_website || '');
        formData.set('location', data.location);
        formData.set('salary', data.salary || '');
        formData.set('employment_type', data.employment_type || '');
        formData.set('working_hours', data.working_hours || '');
        formData.set('directions', JSON.stringify(data.directions));
        formData.set('skills', JSON.stringify(data.skills));
        formData.set('is_visible', String(data.is_visible));
        if (imageFile) formData.set('imageFile', imageFile);
        if (documentFile) formData.set('documentFile', documentFile);
        formData.set('removeImage', String(removeExistingImage));
        formData.set('removeDocument', String(removeExistingDocument));

        startTransition(async () => {
            const result = isEditing
                ? await updateVacancyAction(vacancyId, formData)
                : await createVacancyAction(formData);

            if (result.success) {
                showToast(isEditing ? 'Vacature bijgewerkt.' : 'Vacature aangemaakt.', 'success');
                router.push('/beheer/bijbanenbank');
                router.refresh();
            } else {
                showToast(result.error || 'Opslaan mislukt.', 'error');
            }
        });
    };

    return (
        <Box pb={64}>
            <Paper radius={0} shadow="xs" py="md">
                <Container size="xl" py={0}>
                    <Group gap="md">
                        <Button
                            component={Link}
                            href="/beheer/bijbanenbank"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h3" c="brand">
                            {isEditing ? 'Vacature Bewerken' : 'Nieuwe Vacature'}
                        </Title>
                    </Group>
                </Container>
            </Paper>

            <Container size="md" py="lg">
                <Card p="xl" shadow="md">
                    <Stack gap="lg">
                        <Group gap="sm">
                            <ThemeIcon size="xl">
                                <Briefcase size={22} />
                            </ThemeIcon>
                            <Title order={2} size="h3">
                                {isEditing ? 'Vacature bewerken' : 'Vacature aanmaken'}
                            </Title>
                        </Group>

                        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} autoComplete="off">
                            <Stack gap="lg">
                                <Controller
                                    control={control}
                                    name="type"
                                    render={({ field }) => (
                                        <NativeSelect
                                            id="field-type"
                                            label="Type vacature"
                                            required
                                            value={field.value}
                                            onChange={field.onChange}
                                            error={errors.type?.message}
                                            data={[
                                                { value: 'parttime', label: 'Bijbaan (parttime)' },
                                                { value: 'internship', label: 'Stage' },
                                            ]}
                                        />
                                    )}
                                />

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                    <TextInput
                                        id="field-title"
                                        label="Functietitel"
                                        required
                                        {...register('title')}
                                        error={errors.title?.message}
                                    />
                                    <TextInput
                                        id="field-company"
                                        label="Bedrijfsnaam"
                                        required
                                        leftSection={<Building2 size={16} />}
                                        {...register('company')}
                                        error={errors.company?.message}
                                    />
                                </SimpleGrid>

                                <Input.Wrapper
                                    id="field-description"
                                    label="Omschrijving"
                                    required
                                    error={errors.description?.message}
                                    description='Gebruik de knoppen voor opmaak, of klik op "Voorbeeld" om te zien hoe de omschrijving op de Bijbanenbank wordt weergegeven.'
                                >
                                    <Box mt={4}>
                                        <Controller
                                            control={control}
                                            name="description"
                                            render={({ field }) => (
                                                <MarkdownEditor
                                                    id="field-description"
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    rows={10}
                                                />
                                            )}
                                        />
                                    </Box>
                                </Input.Wrapper>

                                <Controller
                                    control={control}
                                    name="skills"
                                    render={({ field }) => (
                                        <TagsInput
                                            id="field-skills"
                                            label="Gewenste vaardigheden"
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Typ een vaardigheid en druk op enter"
                                            error={errors.skills?.message}
                                        />
                                    )}
                                />

                                <TextInput
                                    id="field-location"
                                    label="Locatie"
                                    required
                                    leftSection={<MapPin size={16} />}
                                    {...register('location')}
                                    error={errors.location?.message}
                                />

                                {type === 'internship' && (
                                    <Controller
                                        control={control}
                                        name="directions"
                                        render={({ field }) => (
                                            <Checkbox.Group
                                                label="ICT-richting(en)"
                                                required
                                                value={field.value}
                                                onChange={field.onChange}
                                                error={errors.directions?.message}
                                            >
                                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs" mt="xs">
                                                    {ICT_DIRECTIONS.map((option) => (
                                                        <Checkbox key={option} value={option} label={option} />
                                                    ))}
                                                </SimpleGrid>
                                            </Checkbox.Group>
                                        )}
                                    />
                                )}

                                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                    <TextInput
                                        id="field-salary"
                                        label="Salaris / vergoeding"
                                        {...register('salary')}
                                        error={errors.salary?.message}
                                    />
                                    <TextInput
                                        id="field-employment-type"
                                        label="Dienstverband / StageType"
                                        {...register('employment_type')}
                                        error={errors.employment_type?.message}
                                    />
                                    <TextInput
                                        id="field-working-hours"
                                        label="Werktijden"
                                        {...register('working_hours')}
                                        error={errors.working_hours?.message}
                                    />
                                </SimpleGrid>

                                <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                    <Input.Wrapper id="field-image" label="Afbeelding">
                                        <Group gap="xs" mt={4} wrap="nowrap">
                                            {(imagePreview || (initialData?.image && !removeExistingImage)) && (
                                                <Box pos="relative" w={64} h={64} style={{ flexShrink: 0, overflow: 'hidden', borderRadius: 'var(--mantine-radius-md)' }}>
                                                    <MediaAsset
                                                        asset={imagePreview || initialData?.image}
                                                        alt="Voorbeeld"
                                                        fill
                                                        objectFit="cover"
                                                        unoptimized={!!imagePreview}
                                                    />
                                                </Box>
                                            )}
                                            <Button
                                                type="button"
                                                flex={1}
                                                leftSection={<ImageIcon size={16} />}
                                                onClick={() => imageInputRef.current?.click()}
                                            >
                                                {imageFile ? imageFile.name : 'Kies afbeelding'}
                                            </Button>
                                            <input
                                                ref={imageInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/webp"
                                                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                                                style={{ display: 'none' }}
                                            />
                                            {(imagePreview || (initialData?.image && !removeExistingImage)) && (
                                                <ActionIcon
                                                    type="button"
                                                    color="error"
                                                    size="lg"
                                                    onClick={() => {
                                                        handleImageChange(null);
                                                        setRemoveExistingImage(true);
                                                    }}
                                                    aria-label="Verwijder afbeelding"
                                                >
                                                    <X size={16} />
                                                </ActionIcon>
                                            )}
                                        </Group>
                                    </Input.Wrapper>

                                    <Input.Wrapper id="field-document" label="Stageopdracht (PDF/Word)">
                                        <Group gap="xs" mt={4} wrap="nowrap">
                                            <Button
                                                type="button"
                                                flex={1}
                                                leftSection={<FileText size={16} />}
                                                onClick={() => documentInputRef.current?.click()}
                                            >
                                                {documentFile ? documentFile.name : 'Kies bestand'}
                                            </Button>
                                            <input
                                                ref={documentInputRef}
                                                type="file"
                                                accept="application/pdf,.doc,.docx"
                                                onChange={(e) => {
                                                    setDocumentFile(e.target.files?.[0] || null);
                                                    setRemoveExistingDocument(false);
                                                }}
                                                style={{ display: 'none' }}
                                            />
                                            {(documentFile || (initialData?.document && !removeExistingDocument)) && (
                                                <ActionIcon
                                                    type="button"
                                                    color="error"
                                                    size="lg"
                                                    onClick={() => {
                                                        setDocumentFile(null);
                                                        setRemoveExistingDocument(true);
                                                    }}
                                                    aria-label="Verwijder document"
                                                >
                                                    <X size={16} />
                                                </ActionIcon>
                                            )}
                                        </Group>
                                        {initialData?.document && !documentFile && !removeExistingDocument && (
                                            <Box mt="xs">
                                                <DocumentAsset id={initialData.document} label="Huidig document bekijken" />
                                            </Box>
                                        )}
                                    </Input.Wrapper>
                                </SimpleGrid>

                                <Divider />

                                <Stack gap="sm">
                                    <Title order={4} size="h5">
                                        Contactgegevens
                                    </Title>
                                    <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                        <TextInput
                                            id="field-contact-email"
                                            label="E-mailadres"
                                            type="email"
                                            required
                                            leftSection={<Mail size={16} />}
                                            {...register('contact_email')}
                                            error={errors.contact_email?.message}
                                        />
                                        <TextInput
                                            id="field-contact-phone"
                                            label="Telefoonnummer"
                                            {...register('contact_phone')}
                                            error={errors.contact_phone?.message}
                                        />
                                        <TextInput
                                            id="field-contact-website"
                                            label="Website"
                                            {...register('contact_website')}
                                            error={errors.contact_website?.message}
                                        />
                                    </SimpleGrid>
                                </Stack>

                                <Controller
                                    control={control}
                                    name="is_visible"
                                    render={({ field }) => (
                                        <Switch
                                            label="Zichtbaar op de website"
                                            checked={field.value}
                                            onChange={(e) => field.onChange(e.currentTarget.checked)}
                                        />
                                    )}
                                />

                                <Button type="submit" size="lg" fullWidth loading={isPending}>
                                    {isPending ? 'Opslaan...' : isEditing ? 'Wijzigingen opslaan' : 'Vacature aanmaken'}
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Card>
            </Container>
        </Box>
    );
}
