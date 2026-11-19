'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
    Badge,
    Button,
    Card,
    Divider,
    Group,
    Paper,
    SimpleGrid,
    Stack,
    Switch,
    Text,
    Textarea,
    TextInput,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { type CoboBoardPreference } from '@salvemundi/validations';
import { updateBoardPreferenceAction } from '@/server/actions/beheer/cobo/beheer-cobo-management.actions';
import { Shield, Wine, Ban, Utensils, FileText, Save } from 'lucide-react';
import Image from 'next/image';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface Props {
    coboId: number;
    initialPreferences: CoboBoardPreference[];
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export default function CoboBoardPreferencesManager({
    coboId,
    initialPreferences,
    showToast
}: Props) {
    const router = useRouter();
    const [preferences, setPreferences] = useState<CoboBoardPreference[]>(initialPreferences);
    const [savingUserId, setSavingUserId] = useState<string | null>(null);
    const [, startTransition] = useTransition();

    useEffect(() => {
        setPreferences(initialPreferences);
    }, [initialPreferences]);

    const handleFieldChange = <K extends keyof CoboBoardPreference>(
        userId: string,
        field: K,
        value: CoboBoardPreference[K]
    ) => {
        setPreferences(prev =>
            prev.map(p => {
                if (p.user_id === userId) {
                    return { ...p, [field]: value };
                }
                return p;
            })
        );
    };

    const handleToggleAlcohol = (pref: CoboBoardPreference) => {
        if (!pref.user_id) return;
        const newAlcohol = !pref.drinks_alcohol;

        setPreferences(prev =>
            prev.map(p => {
                if (p.user_id === pref.user_id) {
                    return { ...p, drinks_alcohol: newAlcohol };
                }
                return p;
            })
        );

        startTransition(async () => {
            try {
                const res = await updateBoardPreferenceAction({
                    cobo_id: coboId,
                    user_id: pref.user_id as string,
                    drinks_alcohol: newAlcohol,
                    vetoes: pref.vetoes || '',
                    dietary_requirements: pref.dietary_requirements || '',
                    notes: pref.notes || ''
                });

                if (res.success) {
                    showToast(`Alcoholvoorkeur van ${pref.user?.first_name || 'bestuurslid'} bijgewerkt!`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Opslaan mislukt', 'error');
                }
            } catch {
                showToast('Er is een fout opgetreden bij het opslaan', 'error');
            }
        });
    };

    const handleSaveMember = (pref: CoboBoardPreference) => {
        if (!pref.user_id) return;

        setSavingUserId(pref.user_id);
        startTransition(async () => {
            try {
                const res = await updateBoardPreferenceAction({
                    cobo_id: coboId,
                    user_id: pref.user_id as string,
                    drinks_alcohol: pref.drinks_alcohol ?? true,
                    vetoes: pref.vetoes || '',
                    dietary_requirements: pref.dietary_requirements || '',
                    notes: pref.notes || ''
                });

                if (res.success) {
                    showToast(`Voorkeuren van ${pref.user?.first_name || 'bestuurslid'} opgeslagen!`, 'success');
                    router.refresh();
                } else {
                    showToast(res.error || 'Opslaan mislukt', 'error');
                }
            } catch {
                showToast('Er is een fout opgetreden bij het opslaan', 'error');
            } finally {
                setSavingUserId(null);
            }
        });
    };

    if (preferences.length === 0) {
        return (
            <Card withBorder padding="xl" ta="center">
                <Stack align="center" gap="xs">
                    <ThemeIcon size="xl" variant="light" color="brand">
                        <Shield size={24} />
                    </ThemeIcon>
                    <Title order={3} size="h4">Geen bestuursleden gevonden</Title>
                    <Text size="sm" c="dimmed">
                        Zorg dat er bestuursleden zijn gekoppeld in het bestuursoverzicht.
                    </Text>
                </Stack>
            </Card>
        );
    }

    return (
        <Stack gap="lg">
            <Stack gap={2}>
                <Title order={3} size="h4" c="brand">
                    Bestuursvoorkeuren &amp; Veto&apos;s
                </Title>
                <Text size="xs" c="dimmed">
                    Beheer per bestuurslid of ze alcohol drinken, welke drankjes zij weigeren (veto&apos;s) en eventuele allergieën.
                </Text>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                {preferences.map((pref) => {
                    const userId = pref.user_id || '';
                    const isSaving = savingUserId === userId;
                    const memberName = [pref.user?.first_name, pref.user?.last_name].filter(Boolean).join(' ') || 'Bestuurslid';

                    return (
                        <Card key={userId || pref.id} withBorder padding="lg">
                            <Stack justify="space-between" h="100%" gap="md">
                                <Stack gap="md">
                                    <Group gap="md" wrap="nowrap">
                                        <Paper
                                            withBorder
                                            radius="md"
                                            style={{
                                                width: 56,
                                                height: 56,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {pref.user?.avatar ? (
                                                <Image
                                                    src={getImageUrl(pref.user.avatar)}
                                                    alt={memberName}
                                                    fill
                                                    style={{ objectFit: 'cover' }}
                                                    unoptimized
                                                />
                                            ) : (
                                                <FallbackLogo className="object-contain p-2 opacity-45" />
                                            )}
                                        </Paper>
                                        <Stack gap={4} style={{ minWidth: 0, flex: 1 }}>
                                            <Title order={4} size="md" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {memberName}
                                            </Title>
                                            <Group>
                                                <Badge color="brand" variant="light" size="sm">
                                                    {pref.user?.functie || 'Bestuurslid'}
                                                </Badge>
                                            </Group>
                                        </Stack>
                                    </Group>

                                    <Divider />

                                    <Paper withBorder p="sm" radius="md">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Text span c={pref.drinks_alcohol ? 'success' : 'error'} lh={1}>
                                                    <Wine size={16} />
                                                </Text>
                                                <Text size="xs" fw={600}>Drinkt Alcohol</Text>
                                            </Group>
                                            <Switch
                                                checked={Boolean(pref.drinks_alcohol)}
                                                onChange={() => handleToggleAlcohol(pref)}
                                                color="success"
                                                aria-label="Toggle alcoholconsumptie"
                                            />
                                        </Group>
                                    </Paper>

                                    <TextInput
                                        label={
                                            <Group gap={6} component="span">
                                                <Text span c="error" lh={1}><Ban size={14} /></Text>
                                                <Text span inherit>Veto&apos;s</Text>
                                            </Group>
                                        }
                                        value={pref.vetoes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'vetoes', e.currentTarget.value)}
                                        placeholder="Bijv. Tequila, Sambuca, melkproducten..."
                                    />

                                    <TextInput
                                        label={
                                            <Group gap={6} component="span">
                                                <Text span c="accent" lh={1}><Utensils size={14} /></Text>
                                                <Text span inherit>Allergieën</Text>
                                            </Group>
                                        }
                                        value={pref.dietary_requirements || ''}
                                        onChange={(e) => handleFieldChange(userId, 'dietary_requirements', e.currentTarget.value)}
                                        placeholder="Bijv. Notenallergie, Glutenintolerantie, Vegan..."
                                    />

                                    <Textarea
                                        label={
                                            <Group gap={6} component="span">
                                                <Text span c="brand" lh={1}><FileText size={14} /></Text>
                                                <Text span inherit>Extra Opmerkingen</Text>
                                            </Group>
                                        }
                                        value={pref.notes || ''}
                                        onChange={(e) => handleFieldChange(userId, 'notes', e.currentTarget.value)}
                                        rows={2}
                                        placeholder="Bijzonderheden of instructies voor Team CoBo..."
                                    />
                                </Stack>

                                <Stack gap="sm">
                                    <Divider />
                                    <Group justify="flex-end">
                                        <Button
                                            type="button"
                                            size="xs"
                                            onClick={() => handleSaveMember(pref)}
                                            loading={isSaving}
                                            leftSection={<Save size={14} />}
                                        >
                                            Opslaan
                                        </Button>
                                    </Group>
                                </Stack>
                            </Stack>
                        </Card>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
}
