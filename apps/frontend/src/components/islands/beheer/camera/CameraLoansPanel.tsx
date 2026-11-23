'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Undo2 } from 'lucide-react';
import {
    Badge,
    Button,
    Card,
    Divider,
    Group,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { CAMERA_CHECKLIST_ITEMS, type CameraAdminLoan } from '@salvemundi/validations';
import { formatDate } from '@/shared/lib/utils/date';
import { returnCameraAction } from '@/server/actions/beheer/camera/beheer-camera.actions';

type Toast = (message: string, type: 'success' | 'error') => void;

function missingItems(loan: CameraAdminLoan) {
    return CAMERA_CHECKLIST_ITEMS.filter((i) => !loan.checklist[i.key]).map((i) => i.label);
}

function LoanCard({ loan, today, showToast }: { loan: CameraAdminLoan; today: string; showToast: Toast }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [returnedOn, setReturnedOn] = useState(today);
    const [condition, setCondition] = useState('');
    const open = loan.returned_on === null;
    const missing = missingItems(loan);

    const giveBack = () => {
        startTransition(async () => {
            const result = await returnCameraAction({ id: loan.id, returned_on: returnedOn, condition });
            if (result.success) {
                showToast('Terugbrengen geregistreerd', 'success');
                router.refresh();
            } else {
                showToast(result.error, 'error');
            }
        });
    };

    return (
        <Card withBorder padding="lg">
            <Stack gap="sm">
                <Group gap="xs" wrap="wrap">
                    <Text size="sm" fw={700}>{loan.event_name}</Text>
                    <Badge color={open ? 'brand' : 'success'}>
                        {open ? 'Uitgeleend' : 'Teruggebracht'}
                    </Badge>
                    {loan.days_late > 0 && (
                        <Badge color="error" leftSection={<AlertTriangle size={12} />}>
                            {loan.days_late} {loan.days_late === 1 ? 'dag' : 'dagen'} te laat
                        </Badge>
                    )}
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing={4}>
                    <Text size="xs" c="dimmed">Lener: {loan.borrower_name}</Text>
                    <Text size="xs" c="dimmed">Fotograaf: {loan.photographer_name ?? 'niet toegewezen'}</Text>
                    <Text size="xs" c="dimmed">Meegegeven: {formatDate(loan.handed_out_at, 'd MMM yyyy HH:mm')}</Text>
                    <Text size="xs" c="dimmed">Afgesproken tot: {formatDate(loan.agreed_end_date, 'd MMM yyyy')}</Text>
                    {loan.returned_on && (
                        <Text size="xs" c="dimmed">Teruggebracht: {formatDate(loan.returned_on, 'd MMM yyyy')}</Text>
                    )}
                </SimpleGrid>

                <Group gap={6}>
                    <Text span c={loan.complete ? 'success' : 'accent'} lh={1}>
                        {loan.complete ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    </Text>
                    <Text size="xs" fw={700} c={loan.complete ? 'success' : 'accent'}>
                        {loan.complete ? 'Compleet meegegeven' : `Niet compleet meegegeven: ${missing.join(', ')}`}
                    </Text>
                </Group>
                {loan.handout_note && <Text size="xs" c="dimmed">Bij meegeven: {loan.handout_note}</Text>}
                {loan.condition_on_return && <Text size="xs" c="dimmed">Staat bij terugbrengen: {loan.condition_on_return}</Text>}

                {open && (
                    <>
                        <Divider />
                        <Group align="flex-end" wrap="wrap" gap="sm">
                            <DateInput
                                label="Teruggebracht op"
                                value={returnedOn || null}
                                onChange={(val) => setReturnedOn(val ?? '')}
                                valueFormat="DD-MM-YYYY"
                            />
                            <TextInput
                                label="Staat bij terugbrengen"
                                value={condition}
                                maxLength={500}
                                placeholder="Bijv. alles compleet, geen schade"
                                onChange={(e) => setCondition(e.currentTarget.value)}
                                style={{ flex: 1, minWidth: 180 }}
                            />
                            <Button
                                type="button"
                                onClick={giveBack}
                                disabled={isPending || !returnedOn}
                                loading={isPending}
                                leftSection={<Undo2 size={14} />}
                            >
                                Teruggebracht
                            </Button>
                        </Group>
                    </>
                )}
            </Stack>
        </Card>
    );
}

export default function CameraLoansPanel({
    loans,
    today,
    showToast,
}: {
    loans: CameraAdminLoan[];
    today: string;
    showToast: Toast;
}) {
    if (loans.length === 0) {
        return <Text py="xl" ta="center" size="sm" fw={700} c="dimmed">Er is nog niets uitgeleend.</Text>;
    }
    const sorted = [...loans].sort((a, b) => Number(a.returned_on !== null) - Number(b.returned_on !== null));
    return (
        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="md">
            {sorted.map((l) => (
                <LoanCard key={l.id} loan={l} today={today} showToast={showToast} />
            ))}
        </SimpleGrid>
    );
}
