import Image from 'next/image';
import { Phone } from 'lucide-react';
import { Box, Button, Card, CardSection, Paper, Stack, Text, Title } from '@mantine/core';
import type { IntroConfidant } from '@salvemundi/validations/schema/intro.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface IntroConfidantCardProps {
    confidant: IntroConfidant;
}

export default function IntroConfidantCard({ confidant }: IntroConfidantCardProps) {
    const imageUrl = confidant.image
        ? getImageUrl(confidant.image, { width: 640, height: 480, fit: 'cover' })
        : null;

    return (
        <Card h="100%" padding="md" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CardSection pos="relative" bg="var(--mantine-color-body)" style={{ aspectRatio: '4 / 3', overflow: 'hidden' }}>
                {imageUrl ? (
                    <Image src={imageUrl} alt={confidant.name} fill unoptimized className="object-cover object-top" />
                ) : (
                    <FallbackLogo alt={confidant.name} className="object-cover" />
                )}
            </CardSection>

            <Stack flex={1} justify="space-between" pt="md" gap="sm">
                <Box>
                    <Title order={3} size="h5" c="brand" lineClamp={1}>
                        {confidant.name}
                    </Title>
                    <Text size="xs" fw={600} c="brand">
                        Vertrouwenscontactpersoon
                    </Text>

                    {confidant.bio && (
                        <Text size="xs" c="dimmed" lineClamp={2} mt="xs">
                            {confidant.bio}
                        </Text>
                    )}
                </Box>

                <Stack gap="xs" mt="auto">
                    {confidant.email && (
                        <Paper p="xs" bg="var(--mantine-color-body)" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
                            <ObfuscatedEmail
                                email={confidant.email}
                                size="xs"
                                fullWidth
                            />
                        </Paper>
                    )}
                    {confidant.phone_number && (
                        <Button
                            component="a"
                            href={`tel:${confidant.phone_number.replace(/\s+/g, '')}`}
                            size="xs"
                            fullWidth
                            justify="flex-start"
                            leftSection={<Phone size={14} />}
                        >
                            {confidant.phone_number}
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Card>
    );
}
