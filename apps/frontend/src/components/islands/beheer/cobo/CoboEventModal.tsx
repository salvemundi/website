'use client';

import React, { useState, useTransition } from 'react';
import {
    Button,
    Divider,
    Group,
    Modal,
    SimpleGrid,
    Stack,
    Text,
    Textarea,
    TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { createCoboEventAction, updateCoboEventAction } from '@/server/actions/beheer/cobo/beheer-cobo-management.actions';
import { type CoboEvent } from '@salvemundi/validations';
import { Calendar, MapPin, FileText, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toLocalInputValue } from '@/shared/lib/utils/date';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    eventToEdit?: CoboEvent | null;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

function toPickerString(isoOrDate?: string | Date | null): string | null {
    const local = toLocalInputValue(isoOrDate);
    if (!local) return null;
    return `${local.replace('T', ' ')}:00`;
}

export default function CoboEventModal({
    isOpen,
    onClose,
    eventToEdit,
    showToast
}: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [title, setTitle] = useState(eventToEdit?.title || '');
    const [date, setDate] = useState<string | null>(toPickerString(eventToEdit?.date));
    const [location, setLocation] = useState(eventToEdit?.location || 'Borrelbar Eindhoven');
    const [description, setDescription] = useState(eventToEdit?.description || '');

    React.useEffect(() => {
        if (eventToEdit) {
            setTitle(eventToEdit.title || '');
            setDate(toPickerString(eventToEdit.date));
            setLocation(eventToEdit.location || 'Borrelbar Eindhoven');
            setDescription(eventToEdit.description || '');
        } else {
            setTitle('');
            setDate(null);
            setLocation('Borrelbar Eindhoven');
            setDescription('');
        }
    }, [eventToEdit, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
            showToast('Vul een titel/jaar in voor de CoBo', 'error');
            return;
        }

        const isoDate = date ? new Date(date.replace(' ', 'T')).toISOString() : undefined;

        startTransition(async () => {
            if (eventToEdit) {
                const res = await updateCoboEventAction(eventToEdit.id, {
                    title: trimmedTitle,
                    date: isoDate,
                    location: location.trim(),
                    description: description.trim()
                });

                if (res.success) {
                    showToast('CoBo evenement succesvol bijgewerkt', 'success');
                    onClose();
                    router.refresh();
                } else {
                    showToast(res.error || 'Bijwerken mislukt', 'error');
                }
            } else {
                const res = await createCoboEventAction({
                    title: trimmedTitle,
                    date: isoDate,
                    location: location.trim(),
                    description: description.trim()
                });

                if (res.success) {
                    showToast('Nieuwe CoBo succesvol aangemaakt', 'success');
                    onClose();
                    document.cookie = `cobo_admin_selected_id=${res.event.id}; path=/; max-age=31536000; SameSite=Lax`;
                    router.refresh();
                } else {
                    showToast(res.error || 'Aanmaken mislukt', 'error');
                }
            }
        });
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={
                <Stack gap={2}>
                    <Text fw={700} size="lg" c="brand">
                        {eventToEdit ? `CoBo Bewerken: ${eventToEdit.title ?? ''}` : 'Nieuwe CoBo Aanmaken'}
                    </Text>
                    <Text size="xs" c="dimmed">
                        {eventToEdit ? 'Pas de algemene gegevens en teksten aan' : 'Maak een nieuwe CoBo editie aan voor het komende bestuursjaar'}
                    </Text>
                </Stack>
            }
            size="lg"
            centered
        >
            <form onSubmit={handleSubmit} aria-busy={isPending}>
                <Stack gap="md">
                    <TextInput
                        id="cobo-title"
                        name="title"
                        label={
                            <Group gap={6} component="span">
                                <Text span c="brand" lh={1}><Sparkles size={14} /></Text>
                                <Text span inherit>Titel / Bestuursjaar</Text>
                            </Group>
                        }
                        value={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                        placeholder="Bijv. CoBo 2026 of CoBo Bestuur VIII"
                        required
                    />

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        <DateTimePicker
                            id="cobo-date"
                            label={
                                <Group gap={6} component="span">
                                    <Text span c="brand" lh={1}><Calendar size={14} /></Text>
                                    <Text span inherit>Datum &amp; Aanvangstijd</Text>
                                </Group>
                            }
                            placeholder="Kies datum en tijd"
                            value={date}
                            onChange={setDate}
                            valueFormat="DD-MM-YYYY HH:mm"
                            clearable
                        />

                        <TextInput
                            id="cobo-location"
                            name="location"
                            label={
                                <Group gap={6} component="span">
                                    <Text span c="brand" lh={1}><MapPin size={14} /></Text>
                                    <Text span inherit>Locatie</Text>
                                </Group>
                            }
                            value={location}
                            onChange={(e) => setLocation(e.currentTarget.value)}
                            placeholder="Bijv. Borrelbar Eindhoven"
                        />
                    </SimpleGrid>

                    <Textarea
                        id="cobo-description"
                        name="description"
                        label={
                            <Group gap={6} component="span">
                                <Text span c="brand" lh={1}><FileText size={14} /></Text>
                                <Text span inherit>Algemene Informatie / Uitnodigingstekst</Text>
                            </Group>
                        }
                        value={description}
                        onChange={(e) => setDescription(e.currentTarget.value)}
                        rows={4}
                        placeholder="Toelichting of welkomstboodschap voor de bezoekende besturen..."
                    />

                    <Divider />

                    <Group justify="flex-end" gap="sm">
                        <Button
                            type="button"
                            onClick={onClose}
                            disabled={isPending}
                        >
                            Annuleren
                        </Button>
                        <Button
                            type="submit"
                            loading={isPending}
                        >
                            {eventToEdit ? 'Wijzigingen Opslaan' : 'CoBo Aanmaken'}
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
