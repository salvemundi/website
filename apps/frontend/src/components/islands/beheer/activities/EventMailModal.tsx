'use client';

import { useState, useEffect, useMemo } from 'react';
import { Mail, Send, XCircle, CheckCircle, Users } from 'lucide-react';
import {
    Alert,
    Button,
    Checkbox,
    Divider,
    Group,
    Modal,
    Stack,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
} from '@mantine/core';
import { sendBulkEventEmail } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-mail.actions';
import { getSignupName, getSignupEmail } from '@/lib/activities/activity-signup.utils';
import { type Signup } from './ActiviteitAanmeldingenIsland';

interface EventMailModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: number | string;
    eventName: string;
    signups: Signup[];
}

export default function EventMailModal({ isOpen, onClose, eventId, eventName, signups }: EventMailModalProps) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [paidOnly, setPaidOnly] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const resetForm = () => {
        setSubject('');
        setMessage('');
        setPaidOnly(false);
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
    };

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen]);

    const recipients = useMemo(() => {
        const filtered = paidOnly ? signups.filter(s => s.payment_status === 'paid') : signups;
        const byEmail = new Map<string, { email: string; name: string }>();
        for (const signup of filtered) {
            const email = getSignupEmail(signup);
            if (!email || email === '-') continue;
            const key = email.toLowerCase();
            if (!byEmail.has(key)) {
                byEmail.set(key, { email, name: getSignupName(signup) });
            }
        }
        return Array.from(byEmail.values());
    }, [signups, paidOnly]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setError(null);

        if (recipients.length === 0) {
            setError('Geen ontvangers geselecteerd');
            return;
        }
        if (!subject.trim() || !message.trim()) {
            setError('Vul een onderwerp en bericht in');
            return;
        }
        if (!confirm(`Weet je zeker dat je deze e-mail wilt sturen naar ${recipients.length} deelnemers? Iedereen ontvangt zijn eigen e-mail (BCC), niemand ziet de andere adressen.`)) {
            return;
        }

        setIsLoading(true);
        const res = await sendBulkEventEmail({
            eventId: Number(eventId),
            eventName,
            recipients,
            subject,
            message
        });

        if (res.success) {
            setSuccessMessage(`E-mail succesvol verzonden naar ${recipients.length} deelnemers!`);
            setSubject('');
            setMessage('');
            setTimeout(() => onClose(), 1200);
        } else {
            setError(res.error || 'Er is een fout opgetreden.');
        }
        setIsLoading(false);
    };

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={
                <Group gap="sm">
                    <ThemeIcon color="accent" size="lg">
                        <Mail size={18} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Mail naar Deelnemers</Text>
                </Group>
            }
            size="lg"
            centered
        >
            <Stack gap="md">
                {error && (
                    <Alert color="error" icon={<XCircle size={18} />}>
                        <Text size="xs" fw={600}>{error}</Text>
                    </Alert>
                )}
                {successMessage && (
                    <Alert color="success" icon={<CheckCircle size={18} />}>
                        <Text size="xs" fw={600}>{successMessage}</Text>
                    </Alert>
                )}

                <form onSubmit={(e) => { void handleSubmit(e); }} autoComplete="off">
                    <Stack gap="md">
                        <TextInput
                            label="Onderwerp"
                            placeholder="Bijv: Belangrijke update over de activiteit..."
                            value={subject}
                            onChange={(e) => setSubject(e.currentTarget.value)}
                        />

                        <Textarea
                            label="Bericht"
                            rows={8}
                            placeholder="Typ hier je bericht voor de deelnemers..."
                            value={message}
                            onChange={(e) => setMessage(e.currentTarget.value)}
                        />

                        <Checkbox
                            label="Alleen betaalde aanmeldingen"
                            checked={paidOnly}
                            onChange={(e) => setPaidOnly(e.currentTarget.checked)}
                        />

                        <Alert color="accent" icon={<Users size={16} />}>
                            <Group justify="space-between" wrap="wrap" gap="xs">
                                <Text size="xs" fw={600}>
                                    {recipients.length} ontvanger{recipients.length === 1 ? '' : 's'} geselecteerd
                                </Text>
                                <Text size="xs" c="dimmed">
                                    via BCC, iedereen krijgt een eigen mail
                                </Text>
                            </Group>
                        </Alert>

                        <Divider />

                        <Group justify="flex-end" gap="sm">
                            <Button
                                type="button"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Annuleren
                            </Button>
                            <Button
                                type="submit"
                                loading={isLoading}
                                disabled={isLoading || recipients.length === 0 || !subject.trim() || !message.trim()}
                                rightSection={<Send size={16} />}
                            >
                                Versturen
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </Modal>
    );
}
