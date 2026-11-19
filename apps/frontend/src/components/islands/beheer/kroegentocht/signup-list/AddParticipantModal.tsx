'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
    Alert,
    Button,
    Grid,
    Group,
    Modal,
    Select,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { PUB_CRAWL_ASSOCIATIONS } from '@salvemundi/validations/schema/pub-crawl.zod';

interface AddParticipantModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupNames: string[];
    onAdd: (data: {
        name: string;
        email: string;
        association: string;
        initial: string;
        group_name: string | null;
    }) => Promise<void>;
}

export default function AddParticipantModal({
    isOpen,
    onClose,
    groupNames,
    onAdd,
}: AddParticipantModalProps) {
    const [name, setName] = useState('');
    const [initial, setInitial] = useState('');
    const [email, setEmail] = useState('');
    const [association, setAssociation] = useState('');
    const [groupName, setGroupName] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!name.trim()) {
            setErrorMessage('Naam is verplicht');
            return;
        }

        setIsSubmitting(true);
        try {
            await onAdd({
                name: name.trim(),
                email: email.trim(),
                association: association.trim(),
                initial: initial.trim(),
                group_name: groupName || null,
            });
            setName('');
            setInitial('');
            setEmail('');
            setAssociation('');
            setGroupName('');
            onClose();
        } catch (error: unknown) {
            const err = error instanceof Error ? error.message : String(error);
            setErrorMessage(err || 'Fout bij toevoegen van deelnemer.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            size="md"
            centered
            title={
                <Group gap="xs">
                    <Text span c="brand" lh={1}>
                        <UserPlus size={18} />
                    </Text>
                    <Text fw={700}>Deelnemer Handmatig Toevoegen</Text>
                </Group>
            }
        >
            <form
                onSubmit={(e) => {
                    void handleSubmit(e);
                }}
            >
                <Stack gap="md">
                    <Text size="xs" c="dimmed">
                        Voeg direct een deelnemer toe aan de kroegentocht.
                    </Text>

                    {errorMessage && (
                        <Alert color="error" variant="light">
                            {errorMessage}
                        </Alert>
                    )}

                    <Grid gap="md">
                        <Grid.Col span={{ base: 12, sm: 8 }}>
                            <TextInput
                                label="Voornaam + tussenvoegsel"
                                required
                                placeholder="bijv. Jan van"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </Grid.Col>
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                            <TextInput
                                label="1e letter achtern."
                                description="optioneel"
                                placeholder="bijv. S"
                                maxLength={5}
                                value={initial}
                                onChange={(e) => setInitial(e.target.value)}
                            />
                        </Grid.Col>
                    </Grid>

                    <TextInput
                        label="E-mailadres (optioneel)"
                        type="email"
                        placeholder="jan@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <Select
                        label="Vereniging (optioneel)"
                        placeholder="Selecteer vereniging..."
                        value={association || null}
                        onChange={(val) => setAssociation(val ?? '')}
                        data={PUB_CRAWL_ASSOCIATIONS.map((assoc: string) => ({
                            value: assoc,
                            label: assoc,
                        }))}
                        clearable
                    />

                    {groupNames.length > 0 && (
                        <Select
                            label="Groepsindeling (optioneel)"
                            placeholder="Niet ingedeeld"
                            value={groupName || null}
                            onChange={(val) => setGroupName(val ?? '')}
                            data={groupNames.map((g) => ({ value: g, label: g }))}
                            clearable
                        />
                    )}

                    <Group justify="flex-end" gap="sm" pt="xs">
                        <Button
                            type="button"
                            variant="default"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Annuleren
                        </Button>
                        <Button type="submit" loading={isSubmitting}>
                            Deelnemer Toevoegen
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
