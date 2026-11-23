import Image from 'next/image';
import { Phone } from 'lucide-react';
import { Alert, Box, Card, Group, Paper, Stack, Text, Title } from '@mantine/core';
import type { SafeHaven } from '@salvemundi/validations/schema/safe-havens.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface SafeHavenCardProps {
    safeHaven?: SafeHaven;
}

export default function SafeHavenCard({ safeHaven }: SafeHavenCardProps) {
    const imageUrl = safeHaven?.image
        ? getImageUrl(safeHaven.image, { width: 200, height: 200, fit: 'cover' })
        : null;

    return (
        <Card h="100%" padding="lg" style={{ display: 'flex', flexDirection: 'column' }}>
            <Group gap="md" wrap="nowrap">
                <Box
                    pos="relative"
                    w={{ base: 64, sm: 80 }}
                    h={{ base: 64, sm: 80 }}
                    bg="var(--mantine-color-body)"
                    style={{
                        flexShrink: 0,
                        overflow: 'hidden',
                        borderRadius: 'var(--mantine-radius-md)',
                        boxShadow: 'var(--mantine-shadow-md)',
                    }}
                >
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={safeHaven?.contact_name || 'Safe Haven'}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    ) : (
                        <FallbackLogo
                            alt={safeHaven?.contact_name || 'Safe Haven'}
                            className="object-cover"
                        />
                    )}
                </Box>

                <Stack gap={2} miw={0} flex={1}>
                    <Title order={3} size="h4" c="brand" lineClamp={1}>
                        {safeHaven?.contact_name || ''}
                    </Title>
                    <Text size="sm" fw={600} c="brand">
                        Safe Haven
                    </Text>
                </Stack>
            </Group>

            <Stack gap="xs" mt="lg">
                {safeHaven?.email || safeHaven?.phone_number ? (
                    <>
                        <Paper p="sm" bg="var(--mantine-color-body)" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
                            <ObfuscatedEmail
                                email={safeHaven.email || ''}
                                size="sm"
                                fullWidth
                            />
                        </Paper>
                        {safeHaven.phone_number && (
                            <Paper p="sm" bg="var(--mantine-color-body)" style={{ border: '1px solid var(--mantine-color-default-border)' }}>
                                <Group gap="sm">
                                    <Text span c="brand" lh={1}>
                                        <Phone size={16} />
                                    </Text>
                                    <Text size="sm" fw={500}>
                                        {safeHaven.phone_number}
                                    </Text>
                                </Group>
                            </Paper>
                        )}
                    </>
                ) : (
                    <Alert color="accent" py="xs">
                        <Text size="xs" fw={600} ta="center">
                            Log in om contactgegevens te zien
                        </Text>
                    </Alert>
                )}
            </Stack>
        </Card>
    );
}
