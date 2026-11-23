'use client';

import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Building2, MapPin, Briefcase, CheckCircle2, Image as ImageIcon, FileText, X, Send, ShieldCheck, Users, Info } from 'lucide-react';
import {
    ActionIcon,
    Alert,
    Badge,
    Box,
    Button,
    Card,
    Checkbox,
    Divider,
    FileButton,
    Group,
    InputWrapper,
    Select,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { TagInput } from '@/shared/ui/TagInput';
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { submitVacancy } from '@/server/actions/vacancies/vacancies-submission.actions';
import {
    vacancySubmissionSchema,
    type VacancySubmissionForm,
    ICT_DIRECTIONS
} from '@salvemundi/validations';

const PROCESS_STEPS = [
    { icon: <Send size={16} />, text: 'Je vult dit formulier in en verstuurt je aanmelding.' },
    { icon: <Mail size={16} />, text: 'Je ontvangt direct een e-mail met een link om je e-mailadres te bevestigen.' },
    { icon: <ShieldCheck size={16} />, text: 'Na bevestiging beoordeelt het bestuur van Salve Mundi je aanmelding.' },
    { icon: <Users size={16} />, text: 'Na goedkeuring is je vacature zichtbaar voor ingelogde leden van Salve Mundi — niet voor externe bezoekers van de website.' }
];

function ProcessExplanation() {
    return (
        <Alert mb="lg" title="Hoe werkt het?" icon={<Info size={18} />}>
            <Stack gap="xs" mt="xs">
                {PROCESS_STEPS.map((step, i) => (
                    <Group key={i} align="flex-start" wrap="nowrap" gap="sm">
                        <Badge size="sm" circle mt={2} style={{ flexShrink: 0 }}>
                            {i + 1}
                        </Badge>
                        <Text size="sm" c="dimmed">
                            {step.text}
                        </Text>
                    </Group>
                ))}
            </Stack>
        </Alert>
    );
}

export default function VacancySubmissionFormIsland() {
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const [submitted, setSubmitted] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);

    const {
        register,
        control,
        watch,
        handleSubmit,
        formState: { errors }
    } = useForm<VacancySubmissionForm>({
        resolver: zodResolver(vacancySubmissionSchema),
        defaultValues: {
            title: '',
            company: '',
            description: '',
            type: 'parttime',
            contact_email: '',
            contact_phone: '',
            contact_website: '',
            location: '',
            salary: '',
            employment_type: '',
            working_hours: '',
            directions: [],
            skills: [],
            hp_confirm: ''
        }
    });

    const type = watch('type');

    const handleImageChange = (file: File | null) => {
        setImageFile(file);
        setImagePreview(file ? URL.createObjectURL(file) : null);
    };

    const onSubmit = async (data: VacancySubmissionForm) => {
        if (data.hp_confirm) return;

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
        formData.set('hp_confirm', data.hp_confirm || '');
        if (imageFile) formData.set('imageFile', imageFile);
        if (documentFile) formData.set('documentFile', documentFile);

        startTransition(async () => {
            const result = await submitVacancy(formData);
            if (result.success) {
                setSubmitted(true);
            } else {
                showToast(result.error || 'Er ging iets mis bij het versturen van je aanmelding.', 'error');
            }
        });
    };

    if (submitted) {
        return (
            <Card padding="xl" shadow="xl" withBorder>
                <Stack gap="md">
                    <Group gap="sm">
                        <ThemeIcon size="lg" color="success">
                            <CheckCircle2 size={22} />
                        </ThemeIcon>
                        <Title order={2} size="h2" c="brand">
                            Bedankt voor je aanmelding
                        </Title>
                    </Group>
                    <Text>
                        We hebben je een e-mail gestuurd met een link om je e-mailadres te bevestigen. Zodra je dit
                        hebt gedaan, beoordeelt het bestuur van Salve Mundi je aanmelding. Na goedkeuring is je
                        vacature zichtbaar voor ingelogde leden van Salve Mundi — niet voor externe bezoekers van de
                        website.
                    </Text>
                </Stack>
            </Card>
        );
    }

    return (
        <Stack gap="lg">
            <ProcessExplanation />
            <Card padding="xl" shadow="xl" withBorder>
                <Stack gap="lg">
                    <Stack gap="xs">
                        <Group gap="sm">
                            <ThemeIcon size="lg">
                                <Briefcase size={20} />
                            </ThemeIcon>
                            <Title order={2} size="h2" c="brand">
                                Vacature aanmelden
                            </Title>
                        </Group>
                        <Text size="sm" c="dimmed">
                            Meld een stage of bijbaan aan voor leden van Salve Mundi.
                        </Text>
                    </Stack>

                    <Box component="form" onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} autoComplete="off">
                        <Stack gap="lg">
                            <Controller
                                name="type"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        id="field-type"
                                        label="Type vacature"
                                        required
                                        data={[
                                            { value: 'parttime', label: 'Bijbaan (parttime)' },
                                            { value: 'internship', label: 'Stage' },
                                        ]}
                                        value={field.value}
                                        onChange={(val) => field.onChange((val ?? 'parttime') as VacancySubmissionForm['type'])}
                                        allowDeselect={false}
                                        error={errors.type?.message}
                                    />
                                )}
                            />

                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <TextInput
                                    id="field-title"
                                    label="Functietitel"
                                    required
                                    placeholder="Bijv. Frontend Developer"
                                    error={errors.title?.message}
                                    {...register('title')}
                                />
                                <TextInput
                                    id="field-company"
                                    label="Bedrijfsnaam"
                                    required
                                    placeholder="Bedrijfsnaam"
                                    leftSection={<Building2 size={16} />}
                                    error={errors.company?.message}
                                    {...register('company')}
                                />
                            </SimpleGrid>

                            <InputWrapper
                                id="field-description"
                                label="Omschrijving"
                                required
                                description='Gebruik de knoppen voor opmaak, of klik op "Voorbeeld" om te zien hoe je omschrijving straks op de Bijbanenbank wordt weergegeven.'
                                error={errors.description?.message}
                            >
                                <Controller
                                    control={control}
                                    name="description"
                                    render={({ field }) => (
                                        <MarkdownEditor
                                            id="field-description"
                                            value={field.value}
                                            onChange={field.onChange}
                                            rows={10}
                                            placeholder="Omschrijf de functie, verantwoordelijkheden en wat jullie zoeken in een kandidaat..."
                                        />
                                    )}
                                />
                            </InputWrapper>

                            <InputWrapper
                                id="field-skills"
                                label="Gewenste vaardigheden"
                                error={errors.skills?.message}
                            >
                                <Controller
                                    control={control}
                                    name="skills"
                                    render={({ field }) => (
                                        <TagInput
                                            id="field-skills"
                                            value={field.value}
                                            onChange={field.onChange}
                                            placeholder="Typ een vaardigheid en druk op enter (bijv. React, Communicatief)"
                                        />
                                    )}
                                />
                            </InputWrapper>

                            <TextInput
                                id="field-location"
                                label="Locatie"
                                required
                                placeholder="Bijv. Eindhoven"
                                leftSection={<MapPin size={16} />}
                                error={errors.location?.message}
                                {...register('location')}
                            />

                            {type === 'internship' && (
                                <Controller
                                    name="directions"
                                    control={control}
                                    render={({ field }) => (
                                        <Checkbox.Group
                                            id="field-directions"
                                            label="ICT-richting(en)"
                                            withAsterisk
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
                                    placeholder="Bijv. €12,50 per uur"
                                    error={errors.salary?.message}
                                    {...register('salary')}
                                />
                                <TextInput
                                    id="field-employment-type"
                                    label="Dienstverband/stage type"
                                    placeholder="Bijv. Fulltime"
                                    error={errors.employment_type?.message}
                                    {...register('employment_type')}
                                />
                                <TextInput
                                    id="field-working-hours"
                                    label="Werktijden"
                                    placeholder="Bijv. 16-24 uur/week"
                                    error={errors.working_hours?.message}
                                    {...register('working_hours')}
                                />
                            </SimpleGrid>

                            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                                <InputWrapper id="field-image" label="Afbeelding (optioneel)">
                                    <Group gap="sm" wrap="nowrap" mt={4}>
                                        {imagePreview && (
                                            <Box
                                                pos="relative"
                                                w={64}
                                                h={64}
                                                style={{
                                                    flexShrink: 0,
                                                    borderRadius: 'var(--mantine-radius-md)',
                                                    overflow: 'hidden',
                                                }}
                                            >
                                                <MediaAsset asset={imagePreview} alt="Voorbeeld" fill objectFit="cover" unoptimized />
                                            </Box>
                                        )}
                                        <FileButton
                                            onChange={handleImageChange}
                                            accept="image/jpeg,image/jpg,image/png,image/webp"
                                        >
                                            {(props) => (
                                                <Button
                                                    {...props}
                                                    type="button"
                                                    style={{ flex: 1 }}
                                                    leftSection={<ImageIcon size={16} />}
                                                >
                                                    {imageFile ? imageFile.name : 'Kies afbeelding'}
                                                </Button>
                                            )}
                                        </FileButton>
                                    </Group>
                                </InputWrapper>

                                <InputWrapper id="field-document" label="Stageopdracht (PDF/Word, optioneel)">
                                    <Group gap="xs" wrap="nowrap" mt={4}>
                                        <FileButton
                                            onChange={setDocumentFile}
                                            accept="application/pdf,.doc,.docx"
                                        >
                                            {(props) => (
                                                <Button
                                                    {...props}
                                                    type="button"
                                                    style={{ flex: 1 }}
                                                    leftSection={<FileText size={16} />}
                                                >
                                                    {documentFile ? documentFile.name : 'Kies bestand'}
                                                </Button>
                                            )}
                                        </FileButton>
                                        {documentFile && (
                                            <ActionIcon
                                                type="button"
                                                color="error"
                                                size="lg"
                                                onClick={() => setDocumentFile(null)}
                                                aria-label="Verwijder document"
                                            >
                                                <X size={16} />
                                            </ActionIcon>
                                        )}
                                    </Group>
                                </InputWrapper>
                            </SimpleGrid>

                            <Divider />

                            <Stack gap="sm">
                                <Title order={3} size="h6">Contactgegevens</Title>
                                <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
                                    <TextInput
                                        id="field-contact-email"
                                        type="email"
                                        label="E-mailadres"
                                        required
                                        placeholder="contact@bedrijf.nl"
                                        leftSection={<Mail size={16} />}
                                        error={errors.contact_email?.message}
                                        {...register('contact_email')}
                                    />
                                    <TextInput
                                        id="field-contact-phone"
                                        label="Telefoonnummer"
                                        placeholder="+31612345678"
                                        error={errors.contact_phone?.message}
                                        {...register('contact_phone')}
                                    />
                                    <TextInput
                                        id="field-contact-website"
                                        label="Website"
                                        placeholder="https://bedrijf.nl"
                                        error={errors.contact_website?.message}
                                        {...register('contact_website')}
                                    />
                                </SimpleGrid>
                            </Stack>

                            <Button type="submit" fullWidth size="lg" loading={isPending}>
                                {isPending ? 'Versturen...' : 'Vacature aanmelden'}
                            </Button>

                            <Box
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: 0,
                                    height: 0,
                                    overflow: 'hidden',
                                    opacity: 0,
                                    pointerEvents: 'none',
                                }}
                            >
                                <TextInput {...register('hp_confirm')} id="hp_confirm" label="Website" tabIndex={-1} autoComplete="off" display="none" suppressHydrationWarning />
                            </Box>
                        </Stack>
                    </Box>
                </Stack>
            </Card>
        </Stack>
    );
}
