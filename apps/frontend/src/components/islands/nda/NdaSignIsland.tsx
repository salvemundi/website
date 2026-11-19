'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Send } from 'lucide-react';
import { Alert, Anchor, Box, Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core';
import { SignaturePad, type SignaturePadHandle } from '@/components/ui/forms/SignaturePad';
import { signMyNda } from '@/server/actions/nda/member-nda.actions';
import { reverseGeocode } from '@/shared/lib/utils/geolocation';

interface Props {
    signatureId: number;
    committeeName: string;
    documentFileId: string;
}

export default function NdaSignIsland({ signatureId, committeeName, documentFileId }: Props) {
    const router = useRouter();
    const signaturePadRef = useRef<SignaturePadHandle>(null);

    const [city, setCity] = useState('');
    const [locating, setLocating] = useState(false);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const handleUseLocation = () => {
        const geo = typeof window !== 'undefined' ? window.navigator.geolocation : undefined;
        if (!geo) {
            setLocationError('Locatiebepaling wordt niet ondersteund door je browser. Vul de stad handmatig in.');
            return;
        }
        setLocating(true);
        setLocationError(null);
        geo.getCurrentPosition(
            (position) => {
                void reverseGeocode(position.coords.latitude, position.coords.longitude).then((result) => {
                    setLocating(false);
                    if (result.city) {
                        setCity(result.city);
                    } else {
                        setLocationError('Kon geen stad bepalen. Vul deze handmatig in.');
                    }
                });
            },
            () => {
                setLocating(false);
                setLocationError('Locatietoegang geweigerd. Vul de stad handmatig in.');
            }
        );
    };

    const handleSubmit = async () => {
        if (!city.trim()) {
            setSubmitError('Locatie is verplicht');
            return;
        }
        const blob = await signaturePadRef.current?.toBlob();
        if (!blob) {
            setSubmitError('Zet eerst je handtekening');
            return;
        }

        setSubmitting(true);
        setSubmitError(null);
        const formData = new FormData();
        formData.append('signature', blob, 'signature.png');
        formData.append('city', city.trim());
        const result = await signMyNda(signatureId, formData);
        setSubmitting(false);

        if (!result.success) {
            setSubmitError(result.error);
            return;
        }
        router.push('/profiel/nda');
    };

    return (
        <Stack gap="lg">
            <Card padding="lg" radius="xl" withBorder>
                <Stack gap="xs">
                    <Title order={2} size="h4">
                        NDA — {committeeName}
                    </Title>
                    <Text size="sm" c="dimmed">
                        Dit document is al ondertekend door de secretaris namens SV Salve Mundi.
                    </Text>
                    <Anchor
                        href={`/api/assets/${documentFileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        fw={600}
                        c="brand"
                    >
                        Document bekijken
                    </Anchor>
                </Stack>
            </Card>

            <Card padding="lg" radius="xl" withBorder>
                <Stack gap="sm">
                    <Title order={3} size="h5">
                        Locatie
                    </Title>
                    <Group gap="sm" align="flex-start" wrap="wrap">
                        <TextInput
                            value={city}
                            onChange={(e) => setCity(e.currentTarget.value)}
                            placeholder="Stad waar je nu bent"
                            style={{ flex: 1, minWidth: 200 }}
                        />
                        <Button
                            type="button"
                            variant="light"
                            onClick={handleUseLocation}
                            loading={locating}
                            leftSection={<MapPin size={16} />}
                        >
                            Locatie ophalen
                        </Button>
                    </Group>
                    {locationError && (
                        <Text size="xs" fw={600} c="error">
                            {locationError}
                        </Text>
                    )}
                </Stack>
            </Card>

            <Card padding="lg" radius="xl" withBorder>
                <Stack gap="sm">
                    <Title order={3} size="h5">
                        Jouw handtekening
                    </Title>
                    <SignaturePad ref={signaturePadRef} />
                </Stack>
            </Card>

            {submitError && (
                <Alert color="error" variant="light">
                    {submitError}
                </Alert>
            )}

            <Box>
                <Button
                    type="button"
                    size="md"
                    onClick={() => { void handleSubmit(); }}
                    loading={submitting}
                    leftSection={<Send size={16} />}
                >
                    Ondertekenen
                </Button>
            </Box>
        </Stack>
    );
}
