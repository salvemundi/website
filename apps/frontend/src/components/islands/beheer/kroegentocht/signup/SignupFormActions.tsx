'use client';

import { RefreshCw, Trash, Save } from 'lucide-react';
import { Button, Group } from '@mantine/core';

interface SignupFormActionsProps {
    isPending: boolean;
    onReset: () => void;
    onDelete: () => void;
}

export default function SignupFormActions({
    isPending,
    onReset,
    onDelete,
}: SignupFormActionsProps) {
    return (
        <Group justify="space-between" wrap="wrap" gap="md">
            <Group gap="sm">
                <Button
                    type="button"
                    size="md"
                    onClick={onReset}
                    leftSection={<RefreshCw size={16} />}
                >
                    Reset
                </Button>

                <Button
                    type="button"
                    color="error"
                    size="md"
                    onClick={onDelete}
                    leftSection={<Trash size={16} />}
                >
                    Verwijder Aanmelding
                </Button>
            </Group>

            <Button
                type="submit"
                size="md"
                loading={isPending}
                leftSection={<Save size={18} />}
            >
                Wijzigingen Opslaan
            </Button>
        </Group>
    );
}
