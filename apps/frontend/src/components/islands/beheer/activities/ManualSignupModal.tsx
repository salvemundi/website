'use client';

import { useState, useEffect } from 'react';
import type { SyntheticEvent } from 'react';
import { User, UserPlus, XCircle, CheckCircle } from 'lucide-react';
import {
    Alert,
    Button,
    Divider,
    Group,
    Modal,
    Stack,
    Tabs,
    Text,
    ThemeIcon,
} from '@mantine/core';
import { createManualSignupAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import { type UserBasic } from '@salvemundi/validations';

import MemberTab from './manual/MemberTab';
import GuestTab from './manual/GuestTab';

interface ManualSignupModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string | number;
    eventName: string;
}

export default function ManualSignupModal({ isOpen, onClose, eventId, eventName }: ManualSignupModalProps) {
    const [activeTab, setActiveTab] = useState<'member' | 'guest'>('member');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [selectedMember, setSelectedMember] = useState<UserBasic | null>(null);

    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    const resetForm = () => {
        setActiveTab('member');
        setIsLoading(false);
        setError(null);
        setSuccessMessage(null);
        setSelectedMember(null);
        setGuestName('');
        setGuestEmail('');
        setGuestPhone('');
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleMemberSelect = (user: UserBasic) => {
        setSelectedMember(user);
    };

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const guestData = activeTab === 'guest' ? { name: guestName, email: guestEmail, phone: guestPhone } : undefined;
        const memberData = activeTab === 'member' ? (selectedMember ?? undefined) : undefined;

        if (activeTab === 'member' && !selectedMember) {
            setError('Selecteer een lid');
            setIsLoading(false);
            return;
        }

        const res = await createManualSignupAction(Number(eventId), eventName, activeTab, guestData, memberData);

        if (res.success) {
            const name = (activeTab === 'member' && selectedMember)
                ? `${selectedMember.first_name} ${selectedMember.last_name || ''}`
                : guestName;
            setSuccessMessage(`Succesvol ingeschreven: ${name}`);
            setTimeout(() => {
                onClose();
                window.location.reload();
            }, 1000);
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
                        <UserPlus size={18} />
                    </ThemeIcon>
                    <Text fw={700} size="lg">Handmatig Inschrijven</Text>
                </Group>
            }
            size="lg"
            centered
        >
            <Stack gap="md">
                <Tabs
                    value={activeTab}
                    onChange={(val) => {
                        if (val === 'member' || val === 'guest') {
                            setActiveTab(val);
                        }
                    }}
                >
                    <Tabs.List grow>
                        <Tabs.Tab value="member" leftSection={<User size={14} />}>
                            Lid
                        </Tabs.Tab>
                        <Tabs.Tab value="guest" leftSection={<UserPlus size={14} />}>
                            Gast (Niet-lid)
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

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
                    <Stack gap="lg">
                        {activeTab === 'member' ? (
                            <MemberTab
                                selectedMember={selectedMember}
                                onSelect={handleMemberSelect}
                                onClear={() => setSelectedMember(null)}
                            />
                        ) : (
                            <GuestTab
                                name={guestName}
                                email={guestEmail}
                                phone={guestPhone}
                                onNameChange={setGuestName}
                                onEmailChange={setGuestEmail}
                                onPhoneChange={setGuestPhone}
                            />
                        )}

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
                                disabled={isLoading || (activeTab === 'member' && !selectedMember)}
                                rightSection={<CheckCircle size={16} />}
                            >
                                Bevestig Inschrijving
                            </Button>
                        </Group>
                    </Stack>
                </form>
            </Stack>
        </Modal>
    );
}
