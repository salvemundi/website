'use client';

import { useState, useMemo, useOptimistic, useTransition } from 'react';
import Link from 'next/link';
import { Search, Download, UserPlus, QrCode, Mail } from 'lucide-react';
import {
    Button,
    Card,
    Group,
    Select,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { deleteSignupAction, toggleCheckInAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import ManualSignupModal from './ManualSignupModal';
import EventMailModal from './EventMailModal';
import { useRouter } from 'next/navigation';
import { useAdminToast } from '@/hooks/use-beheer-toast';
import { getSignupName, getSignupEmail, getSignupPhone } from '@/lib/activities/activity-signup.utils';
import { exportSignupsToCSV } from '@/lib/activities/activity-export';
import ActivitySignupTable from '@/components/admin/activities/ActivitySignupTable';

export interface Signup {
    id: number;
    participant_name: string;
    participant_email: string;
    participant_phone?: string | null;
    payment_status?: string;
    amount_paid?: number | null;
    created_at: string;
    checked_in?: boolean;
    checked_in_at?: string | null;
    is_member?: boolean;
    directus_relations?: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        phone_number?: string | null;
    } | null;
}

export interface AdminEvent {
    id: number | string;
    name: string;
    price_members?: number | null;
    committee_id?: number | string | null;
    max_sign_ups?: number | null;
}

const PAYMENT_OPTIONS = [
    { value: 'all', label: 'Alle' },
    { value: 'paid', label: 'Betaald' },
    { value: 'open', label: 'Open' }
] as const;

const MEMBERSHIP_OPTIONS = [
    { value: 'all', label: 'Alle' },
    { value: 'member', label: 'Lid' },
    { value: 'guest', label: 'Gast' }
] as const;

export default function ActiviteitAanmeldingenIsland({
    event,
    initialSignups = [],
    canAccessEdit = false
}: {
    event: AdminEvent;
    initialSignups: Signup[];
    canAccessEdit?: boolean;
}) {
    const router = useRouter();
    const { showToast } = useAdminToast();
    const [, startTransition] = useTransition();
    const [searchQuery, setSearchQuery] = useState('');
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'open'>('all');
    const [membershipFilter, setMembershipFilter] = useState<'all' | 'member' | 'guest'>('all');
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [isMailModalOpen, setIsMailModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState<number | null>(null);

    const [optimisticSignups, setOptimisticSignups] = useOptimistic(
        initialSignups,
        (state: Signup[], { id, checkedIn }: { id: number; checkedIn: boolean }) =>
            state.map(s => s.id === id ? { ...s, checked_in: checkedIn } : s)
    );

    const filteredSignups = useMemo(() => {
        const map = new Map<string, Signup>();
        for (const signup of optimisticSignups) {
            const emailKey = getSignupEmail(signup).toLowerCase();
            const idKey = signup.directus_relations?.id || emailKey;
            const key = idKey === '-' ? signup.participant_name : idKey;

            if (!map.has(key)) {
                map.set(key, signup);
            } else {
                const existing = map.get(key);
                if (existing && signup.payment_status === 'paid' && existing.payment_status !== 'paid') {
                    map.set(key, signup);
                }
            }
        }

        const deduplicated = Array.from(map.values());
        const sorted = deduplicated.sort((a, b) => {
            if (a.is_member && !b.is_member) return -1;
            if (!a.is_member && b.is_member) return 1;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        const filtered = sorted.filter(signup => {
            if (paymentFilter !== 'all' && (signup.payment_status || 'open') !== paymentFilter) return false;
            if (membershipFilter === 'member' && !signup.is_member) return false;
            if (membershipFilter === 'guest' && signup.is_member) return false;
            return true;
        });

        if (!searchQuery) return filtered;
        const query = searchQuery.toLowerCase();
        return filtered.filter(signup => {
            const name = getSignupName(signup).toLowerCase();
            const email = getSignupEmail(signup).toLowerCase();
            const phone = getSignupPhone(signup).toLowerCase();
            return name.includes(query) || email.includes(query) || phone.includes(query);
        });
    }, [optimisticSignups, searchQuery, paymentFilter, membershipFilter]);

    async function handleToggleCheckIn(signupId: number, currentCheckedIn: boolean) {
        const newValue = !currentCheckedIn;
        startTransition(async () => {
            setOptimisticSignups({ id: signupId, checkedIn: newValue });
            const res = await toggleCheckInAction(signupId, Number(event.id), newValue);
            if (!res.success) {
                showToast(res.error || 'Fout bij bijwerken check-in', 'error');
            } else {
                showToast(`Check-in ${newValue ? 'voltooid' : 'ongedaan gemaakt'}`, 'success');
                router.refresh();
            }
        });
    }

    async function handleDelete(signupId: number, email: string) {
        if (!confirm('Weet je zeker dat je deze aanmelding wilt verwijderen? De persoon krijgt hierover een e-mail.')) {
            return;
        }

        setIsDeleting(signupId);
        const res = await deleteSignupAction(signupId, event.id, email, event.name);
        if (!res.success) {
            showToast(res.error || 'Fout bij verwijderen', 'error');
        } else {
            showToast('Aanmelding verwijderd', 'success');
            router.refresh();
        }
        setIsDeleting(null);
    }

    return (
        <Stack gap="lg" w="100%">
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
                <Group gap="xs" wrap="wrap">
                    <Button
                        component={Link}
                        href={`/beheer/activiteiten/${event.id}/scanner`}
                        hiddenFrom="md"
                        leftSection={<QrCode size={15} />}
                    >
                        Scanner
                    </Button>
                    <Button
                        type="button"
                        onClick={() => exportSignupsToCSV(filteredSignups, event.name)}
                        disabled={filteredSignups.length === 0}
                        leftSection={<Download size={15} />}
                    >
                        Exporteer
                    </Button>
                    {canAccessEdit && (
                        <Button
                            type="button"
                            onClick={() => setIsManualModalOpen(true)}
                            leftSection={<UserPlus size={15} />}
                        >
                            Handmatig
                        </Button>
                    )}
                    {canAccessEdit && (
                        <Button
                            type="button"
                            onClick={() => setIsMailModalOpen(true)}
                            disabled={optimisticSignups.length === 0}
                            leftSection={<Mail size={15} />}
                        >
                            Mail
                        </Button>
                    )}
                </Group>

                <Group gap="sm" align="flex-end" wrap="wrap">
                    <Select
                        label="Betaling"
                        size="sm"
                        w={130}
                        value={paymentFilter}
                        onChange={(val) => {
                            if (val) setPaymentFilter(val as 'all' | 'paid' | 'open');
                        }}
                        data={[...PAYMENT_OPTIONS]}
                        allowDeselect={false}
                    />

                    <Select
                        label="Lidmaatschap"
                        size="sm"
                        w={130}
                        value={membershipFilter}
                        onChange={(val) => {
                            if (val) setMembershipFilter(val as 'all' | 'member' | 'guest');
                        }}
                        data={[...MEMBERSHIP_OPTIONS]}
                        allowDeselect={false}
                    />

                    <TextInput
                        size="sm"
                        placeholder="Zoek deelnemers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.currentTarget.value)}
                        leftSection={<Search size={16} />}
                        miw={{ sm: 240 }}
                    />
                </Group>
            </Group>

            <ManualSignupModal
                isOpen={isManualModalOpen}
                onClose={() => setIsManualModalOpen(false)}
                eventId={event.id}
                eventName={event.name}
            />

            <EventMailModal
                isOpen={isMailModalOpen}
                onClose={() => setIsMailModalOpen(false)}
                eventId={event.id}
                eventName={event.name}
                signups={optimisticSignups}
            />

            <Card withBorder padding={0} style={{ overflow: 'hidden' }}>
                {filteredSignups.length === 0 ? (
                    <Stack align="center" gap="sm" p="xl" py={64} ta="center">
                        <ThemeIcon size={64}>
                            <Search size={28} />
                        </ThemeIcon>
                        <Title order={3} size="h4">Geen resultaten</Title>
                        <Text size="xs" c="dimmed" maw={320}>
                            {searchQuery
                                ? 'We konden niemand vinden die voldoet aan je zoekopdracht.'
                                : 'Er zijn nog geen aanmeldingen voor deze activiteit.'}
                        </Text>
                    </Stack>
                ) : (
                    <ActivitySignupTable
                        signups={filteredSignups}
                        canAccessEdit={canAccessEdit}
                        onToggleCheckIn={(id, checkedIn) => { void handleToggleCheckIn(id, checkedIn); }}
                        onDelete={(id, email) => { void handleDelete(id, email); }}
                        isDeletingId={isDeleting}
                    />
                )}
            </Card>
        </Stack>
    );
}
