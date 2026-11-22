'use client';

import { extractGoogleSheetId } from '@/lib/utils/kroegentocht-signups';
import { useState, useTransition } from 'react';
import type { SyntheticEvent } from 'react';
import {
    Save,
    ArrowLeft,
    Calendar,
    Type,
    FileText,
    Mail,
    ImagePlus,
    X,
    MessageCircle,
    Sheet,
    Users,
    Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    ActionIcon,
    Badge,
    Box,
    Button,
    Card,
    Divider,
    FileButton,
    Grid,
    Group,
    Input,
    Loader,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
    Title,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import {
    upsertPubCrawlEvent,
    uploadPubCrawlImage,
} from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { toLocalISOString } from '@/lib/utils/date-utils';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { type PubCrawlEvent } from '@salvemundi/validations/schema/pub-crawl.zod';
import { safeConsoleError } from '@/server/utils/logger';

interface KroegentochtEventFormProps {
    event?: PubCrawlEvent;
}

interface GroupLeader {
    name: string;
    signupId?: number | null;
}

interface GroupConfig {
    name: string;
    leaders?: GroupLeader[];
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

export default function KroegentochtEventForm({ event }: KroegentochtEventFormProps) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [isPending, startTransition] = useTransition();
    const normalizedEventGroups = ((event?.groups || []) as unknown[]).map(
        (g: unknown): GroupConfig => {
            if (typeof g === 'string') return { name: g, leaders: [] };
            const obj = g && typeof g === 'object' ? (g as { name?: unknown; leaders?: unknown }) : {};
            return {
                name: typeof obj.name === 'string' ? obj.name : '',
                leaders: Array.isArray(obj.leaders) ? (obj.leaders as GroupLeader[]) : [],
            };
        }
    );

    const [formData, setFormData] = useState({
        name: event?.name || '',
        description: event?.description || '',
        date: toLocalISOString(event?.date) || '',
        email: event?.email || 'feest@salvemundi.nl',
        image: event?.image || null,
        whatsapp_community_url: event?.whatsapp_community_url || '',
        google_sheet_id: event?.google_sheet_id
            ? `https://docs.google.com/spreadsheets/d/${event.google_sheet_id}/edit`
            : '',
        groups: (normalizedEventGroups.length > 0 ? normalizedEventGroups : []) as GroupConfig[],
    });
    const [uploading, setUploading] = useState(false);

    const isEdit = !!event?.id;

    const handleImageUpload = (file: File | null) => {
        if (!file) return;

        const performUpload = async () => {
            setUploading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);

            try {
                const result: unknown = await uploadPubCrawlImage(uploadData);
                if (result && typeof result === 'object') {
                    const obj = result as { data?: { id?: string }; id?: string };
                    const fileId = obj.data?.id ?? obj.id;
                    if (typeof fileId === 'string') {
                        setFormData((prev) => ({ ...prev, image: fileId }));
                    }
                }
                showToast('Afbeelding succesvol geüpload', 'success');
            } catch (error) {
                safeConsoleError(
                    '[KroegentochtEventForm.tsx][KroegentochtEventForm] Upload mislukt',
                    error
                );
                const message = error instanceof Error ? error.message : 'Upload mislukt';
                showToast(message, 'error');
            } finally {
                setUploading(false);
            }
        };

        void performUpload();
    };

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.google_sheet_id.trim() && !extractGoogleSheetId(formData.google_sheet_id)) {
            showToast('Ongeldige Google Sheet-link. Plak de link uit de adresbalk van de sheet.', 'error');
            return;
        }
        startTransition(async () => {
            try {
                await upsertPubCrawlEvent({
                    ...formData,
                    id: event?.id,
                });
                showToast('Event succesvol opgeslagen', 'success');
                router.push('/beheer/kroegentocht');
                router.refresh();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Fout bij opslaan';
                safeConsoleError(
                    '[KroegentochtEventForm.tsx][KroegentochtEventForm] Error:',
                    error
                );
                showToast(message, 'error');
            }
        });
    };

    return (
        <Box maw={896} mx="auto">
            <Box component="form" onSubmit={handleSubmit}>
                <Stack gap="lg">
                    <Card p="xl" shadow="sm">
                        <Stack gap="lg">
                            <Grid gap="lg">
                                <Grid.Col span={{ base: 12, md: 8 }}>
                                    <Stack gap="md">
                                        <TextInput
                                            label="Event Naam"
                                            required
                                            leftSection={<Type size={14} />}
                                            value={formData.name}
                                            onChange={(e) =>
                                                setFormData({ ...formData, name: e.target.value })
                                            }
                                            placeholder="Bijv. Kroegentocht Stratumseind"
                                        />

                                        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                            <DateInput
                                                label="Datum"
                                                leftSection={<Calendar size={14} />}
                                                value={formData.date || null}
                                                onChange={(val) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        date: val ?? '',
                                                    }))
                                                }
                                                valueFormat="DD-MM-YYYY"
                                                dateParser={parseDutchDate}
                                                placeholder="dd-mm-jjjj"
                                                clearable
                                            />

                                            <TextInput
                                                label="Contact E-mail"
                                                type="email"
                                                leftSection={<Mail size={14} />}
                                                value={formData.email}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        email: e.target.value,
                                                    })
                                                }
                                                placeholder="Bijv. feest@salvemundi.nl"
                                            />
                                        </SimpleGrid>

                                        <TextInput
                                            label="WhatsApp Community Link"
                                            type="url"
                                            leftSection={<MessageCircle size={14} />}
                                            value={formData.whatsapp_community_url}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    whatsapp_community_url: e.target.value,
                                                })
                                            }
                                            placeholder="Bijv. https://chat.whatsapp.com/..."
                                        />

                                        <TextInput
                                            label="Google Sheet (link of ID)"
                                            description="Deel de sheet als Bewerker met het service-account; aanmeldingen worden er dan automatisch naartoe gesynchroniseerd."
                                            leftSection={<Sheet size={14} />}
                                            value={formData.google_sheet_id}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    google_sheet_id: e.target.value,
                                                })
                                            }
                                            placeholder="Bijv. https://docs.google.com/spreadsheets/d/..."
                                        />
                                    </Stack>
                                </Grid.Col>

                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <Input.Wrapper label="Event Afbeelding">
                                        <Box mt={4} h={184}>
                                            {formData.image ? (
                                                <Paper
                                                    withBorder
                                                    pos="relative"
                                                    h="100%"
                                                    style={{ overflow: 'hidden' }}
                                                >
                                                    <MediaAsset
                                                        asset={formData.image}
                                                        alt="Preview"
                                                        fill
                                                        objectFit="cover"
                                                    />
                                                    <ActionIcon
                                                        type="button"
                                                        color="error"
                                                        size="md"
                                                        pos="absolute"
                                                        top={8}
                                                        right={8}
                                                        onClick={() =>
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                image: null,
                                                            }))
                                                        }
                                                        aria-label="Afbeelding verwijderen"
                                                    >
                                                        <X size={16} />
                                                    </ActionIcon>
                                                </Paper>
                                            ) : (
                                                <FileButton
                                                    onChange={handleImageUpload}
                                                    accept="image/*"
                                                    disabled={uploading}
                                                >
                                                    {(props) => (
                                                        <Button
                                                            {...props}
                                                            type="button"
                                                            w="100%"
                                                            h="100%"
                                                            style={{ borderStyle: 'dashed' }}
                                                        >
                                                            <Stack align="center" gap="xs">
                                                                {uploading ? (
                                                                    <Loader size="sm" />
                                                                ) : (
                                                                    <>
                                                                        <ImagePlus size={24} />
                                                                        <Text size="xs" fw={600}>
                                                                            Upload Image
                                                                        </Text>
                                                                    </>
                                                                )}
                                                            </Stack>
                                                        </Button>
                                                    )}
                                                </FileButton>
                                            )}
                                        </Box>
                                    </Input.Wrapper>
                                </Grid.Col>
                            </Grid>

                            <Textarea
                                label="Beschrijving"
                                leftSection={<FileText size={14} />}
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                minRows={5}
                                autosize
                                placeholder="Korte omschrijving voor de deelnemers..."
                            />

                            <Divider />

                            <Stack gap="sm">
                                <Group gap="xs">
                                    <Text span c="brand" lh={1}>
                                        <Users size={16} />
                                    </Text>
                                    <Title order={3} size="h5">
                                        Groepen Indeling ({formData.groups.length})
                                    </Title>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    Definieer de groepen voor deze kroegentocht. Deelnemers kunnen vervolgens over deze groepen verdeeld worden.
                                </Text>

                                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                                    {formData.groups.map((group, index) => (
                                        <Paper key={index} p="sm" withBorder>
                                            <Stack gap="xs">
                                                <Group gap="xs" wrap="nowrap">
                                                    <TextInput
                                                        size="xs"
                                                        flex={1}
                                                        value={group.name}
                                                        onChange={(e) => {
                                                            setFormData({
                                                                ...formData,
                                                                groups: formData.groups.map(
                                                                    (g, i) =>
                                                                        i === index
                                                                            ? {
                                                                                  ...g,
                                                                                  name: e.target
                                                                                      .value,
                                                                              }
                                                                            : g
                                                                ),
                                                            });
                                                        }}
                                                        placeholder={`Groep ${index + 1}`}
                                                        required
                                                    />
                                                    <ActionIcon
                                                        type="button"
                                                        color="error"
                                                        size="sm"
                                                        onClick={() => {
                                                            const updated = formData.groups.filter(
                                                                (_, i) => i !== index
                                                            );
                                                            setFormData({
                                                                ...formData,
                                                                groups: updated,
                                                            });
                                                        }}
                                                        title="Verwijder groep"
                                                        aria-label="Verwijder groep"
                                                    >
                                                        <X size={14} />
                                                    </ActionIcon>
                                                </Group>

                                                {group.leaders && group.leaders.length > 0 && (
                                                    <Stack gap={4}>
                                                        <Text
                                                            size="xs"
                                                            fw={600}
                                                            c="dimmed"
                                                            tt="uppercase"
                                                        >
                                                            Leiders:
                                                        </Text>
                                                        <Group gap={4} wrap="wrap">
                                                            {group.leaders.map((leader, lIdx) => (
                                                                <Badge
                                                                    key={lIdx}
                                                                    size="sm"
                                                                    rightSection={
                                                                        <ActionIcon
                                                                            type="button"
                                                                            size="xs"
                                                                            color="error"
                                                                            onClick={() => {
                                                                                setFormData({
                                                                                    ...formData,
                                                                                    groups: formData.groups.map(
                                                                                        (g, i) => {
                                                                                            if (
                                                                                                i !==
                                                                                                index
                                                                                            )
                                                                                                return g;
                                                                                            return {
                                                                                                ...g,
                                                                                                leaders:
                                                                                                    (
                                                                                                        g.leaders ??
                                                                                                        []
                                                                                                    ).filter(
                                                                                                        (
                                                                                                            _,
                                                                                                            li
                                                                                                        ) =>
                                                                                                            li !==
                                                                                                            lIdx
                                                                                                    ),
                                                                                            };
                                                                                        }
                                                                                    ),
                                                                                });
                                                                            }}
                                                                            title="Verwijder leider"
                                                                            aria-label="Verwijder leider"
                                                                        >
                                                                            <X size={10} />
                                                                        </ActionIcon>
                                                                    }
                                                                >
                                                                    {leader.name}
                                                                </Badge>
                                                            ))}
                                                        </Group>
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </Paper>
                                    ))}

                                    <Button
                                        type="button"
                                        style={{ borderStyle: 'dashed' }}
                                        leftSection={<Plus size={16} />}
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                groups: [
                                                    ...formData.groups,
                                                    {
                                                        name: `Groep ${formData.groups.length + 1}`,
                                                        leaders: [],
                                                    },
                                                ],
                                            });
                                        }}
                                    >
                                        Groep toevoegen
                                    </Button>
                                </SimpleGrid>
                            </Stack>
                        </Stack>
                    </Card>

                    <Group justify="space-between" wrap="wrap" gap="md">
                        <Button
                            component={Link}
                            href="/beheer/kroegentocht"
                            size="md"
                            leftSection={<ArrowLeft size={16} />}
                        >
                            Annuleren
                        </Button>

                        <Button
                            type="submit"
                            size="md"
                            loading={isPending}
                            leftSection={<Save size={18} />}
                        >
                            {isEdit ? 'Wijzigingen Opslaan' : 'Event Aanmaken'}
                        </Button>
                    </Group>
                </Stack>
            </Box>
        </Box>
    );
}
