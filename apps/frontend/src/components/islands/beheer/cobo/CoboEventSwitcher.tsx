'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Group, Select } from '@mantine/core';
import { type CoboEvent } from '@salvemundi/validations';
import { Plus, Settings2 } from 'lucide-react';
import CoboEventModal from './CoboEventModal';
import { useAdminToast } from '@/hooks/use-beheer-toast';

interface Props {
    events: CoboEvent[];
    activeEvent: CoboEvent | null;
}

export default function CoboEventSwitcher({
    events,
    activeEvent
}: Props) {
    const router = useRouter();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<CoboEvent | null>(null);
    const { showToast } = useAdminToast();

    const handleSwitch = (newId: number) => {
        document.cookie = `cobo_admin_selected_id=${newId}; path=/; max-age=31536000; SameSite=Lax`;
        router.refresh();
    };

    const handleEdit = () => {
        setEventToEdit(activeEvent);
        setIsModalOpen(true);
    };

    const handleNew = () => {
        setEventToEdit(null);
        setIsModalOpen(true);
    };

    const options = events.map(e => ({
        value: String(e.id),
        label: e.title || `CoBo #${e.id}`
    }));

    return (
        <>
            <Group gap="xs" wrap="wrap">
                {options.length > 0 && activeEvent && (
                    <Select
                        value={String(activeEvent.id)}
                        onChange={(val) => {
                            if (val) handleSwitch(Number(val));
                        }}
                        data={options}
                        size="sm"
                        allowDeselect={false}
                        miw={200}
                        aria-label="CoBo editie selecteren"
                    />
                )}

                {activeEvent && (
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleEdit}
                        title="CoBo Instellingen & Tekst bewerken"
                        leftSection={<Settings2 size={14} />}
                    >
                        Bewerken
                    </Button>
                )}

                <Button
                    type="button"
                    size="sm"
                    onClick={handleNew}
                    title="Nieuwe CoBo editie aanmaken"
                    leftSection={<Plus size={14} />}
                >
                    Nieuw
                </Button>
            </Group>

            <CoboEventModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                eventToEdit={eventToEdit}
                showToast={showToast}
            />
        </>
    );
}
