'use client';

import { useState } from 'react';
import { AlertCircle, Save } from 'lucide-react';
import {
    Alert,
    Button,
    Group,
    Input,
    SegmentedControl,
    SimpleGrid,
    Stack,
    TextInput,
} from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { type AdminDropWindow } from './webshop-admin-types';
import { toLocalInputValue } from '@/shared/lib/utils/date';

interface Props {
    dropWindow?: AdminDropWindow | null;
    onSave: (formData: FormData) => void;
    onCancel: () => void;
    isPending: boolean;
    error: string | null;
}

export default function BeheerWebshopDropWindowForm({
    dropWindow,
    onSave,
    onCancel,
    isPending,
    error,
}: Props) {
    const [status, setStatus] = useState(dropWindow?.status || 'draft');
    const [opensAt, setOpensAt] = useState<string | null>(() =>
        dropWindow?.opens_at ? toLocalInputValue(dropWindow.opens_at) : null
    );
    const [closesAt, setClosesAt] = useState<string | null>(() =>
        dropWindow?.closes_at ? toLocalInputValue(dropWindow.closes_at) : null
    );
    const [closesError, setClosesError] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!closesAt) {
            setClosesError('Sluitdatum is verplicht');
            return;
        }
        setClosesError(null);
        const fd = new FormData(e.currentTarget);
        if (dropWindow) fd.set('id', String(dropWindow.id));
        fd.set('status', status);
        fd.set('opens_at', opensAt || '');
        fd.set('closes_at', closesAt);
        onSave(fd);
    };

    return (
        <form onSubmit={handleSubmit}>
            <Stack gap="lg">
                {error && (
                    <Alert color="error" variant="light" icon={<AlertCircle size={16} />}>
                        {error}
                    </Alert>
                )}

                <TextInput
                    name="name"
                    label="Naam"
                    required
                    defaultValue={dropWindow?.name || ''}
                    placeholder="Bijv. Voorjaarsdrop 2026"
                />

                <Input.Wrapper label="Status">
                    <SegmentedControl
                        fullWidth
                        mt={4}
                        value={status}
                        onChange={setStatus}
                        data={[
                            { value: 'draft', label: 'Concept' },
                            { value: 'open', label: 'Open' },
                            { value: 'closed', label: 'Gesloten' },
                        ]}
                    />
                </Input.Wrapper>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <DateTimePicker
                        label="Opent op"
                        value={opensAt}
                        onChange={setOpensAt}
                        valueFormat="DD-MM-YYYY HH:mm"
                        placeholder="Kies datum en tijd..."
                        clearable
                    />
                    <DateTimePicker
                        label="Sluit op"
                        required
                        value={closesAt}
                        onChange={(val) => {
                            setClosesAt(val);
                            if (val) setClosesError(null);
                        }}
                        valueFormat="DD-MM-YYYY HH:mm"
                        placeholder="Kies datum en tijd..."
                        error={closesError}
                    />
                </SimpleGrid>

                <Group justify="flex-end" gap="sm" pt="md">
                    <Button type="button" variant="default" onClick={onCancel}>
                        Annuleren
                    </Button>
                    <Button
                        type="submit"
                        loading={isPending}
                        leftSection={<Save size={16} />}
                    >
                        {isPending ? 'Bezig...' : dropWindow ? 'Opslaan' : 'Drop Aanmaken'}
                    </Button>
                </Group>
            </Stack>
        </form>
    );
}
