'use client';

import { useState } from 'react';
import { Button, Group, Paper, Select, Stack, TextInput } from '@mantine/core';

interface Participant {
    name: string;
    association: string;
    signupId: number;
}

interface AddLeaderFormProps {
    participantsList: Participant[];
    onAdd: (name: string, signupId: number | null) => void;
    onCancel: () => void;
}

const leaderTypeOptions = [
    { value: 'signup', label: 'Deelnemer uit groep' },
    { value: 'external', label: 'Externe persoon (Handmatig typen)' },
];

export default function AddLeaderForm({
    participantsList,
    onAdd,
    onCancel,
}: AddLeaderFormProps) {
    const [leaderType, setLeaderType] = useState<'signup' | 'external'>('signup');
    const [leaderName, setLeaderName] = useState('');
    const [leaderSignupId, setLeaderSignupId] = useState('');

    const handleAdd = () => {
        if (leaderType === 'signup') {
            const picked = participantsList.at(Number(leaderSignupId));
            if (!leaderSignupId || !picked) return;
            onAdd(picked.name, picked.signupId);
        } else {
            if (!leaderName.trim()) return;
            onAdd(leaderName.trim(), null);
        }
    };

    const participantOptions = [
        { value: '', label: 'Selecteer deelnemer...' },
        ...participantsList.map((p, i) => ({
            value: String(i),
            label: `${p.name} (${p.association})`,
        })),
    ];

    return (
        <Paper withBorder p="sm" radius="md">
            <Stack gap="xs">
                <Select
                    label="Kies leider type"
                    size="xs"
                    value={leaderType}
                    onChange={(val) => {
                        if (val) {
                            setLeaderType(val as 'signup' | 'external');
                            setLeaderName('');
                            setLeaderSignupId('');
                        }
                    }}
                    data={leaderTypeOptions}
                    allowDeselect={false}
                />

                {leaderType === 'signup' ? (
                    <Select
                        label="Kies deelnemer"
                        size="xs"
                        value={leaderSignupId}
                        onChange={(val) => {
                            setLeaderSignupId(val ?? '');
                        }}
                        data={participantOptions}
                        searchable
                    />
                ) : (
                    <TextInput
                        label="Naam leider"
                        size="xs"
                        placeholder="Vul naam in..."
                        value={leaderName}
                        onChange={(e) => setLeaderName(e.target.value)}
                    />
                )}

                <Group justify="flex-end" gap="xs" pt={4}>
                    <Button type="button" variant="default" size="xs" onClick={onCancel}>
                        Annuleren
                    </Button>
                    <Button
                        type="button"
                        size="xs"
                        onClick={handleAdd}
                        disabled={
                            leaderType === 'signup' ? !leaderSignupId : !leaderName.trim()
                        }
                    >
                        Toevoegen
                    </Button>
                </Group>
            </Stack>
        </Paper>
    );
}
