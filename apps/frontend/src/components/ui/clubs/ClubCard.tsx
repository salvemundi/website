import { Lock, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { Box, Button, Card, CardSection, Spoiler, Stack, Text, Title } from '@mantine/core';
import { getImageUrl } from '@/lib/utils/image-utils';
import { stripHtmlToText } from '@/lib/utils/html-utils';
import { DiscordIcon } from '@/shared/icons/social';
import { ROUTES } from '@/lib/config/routes';
import type { Club } from '@salvemundi/validations/schema/clubs.zod';

import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface ClubCardProps {
    club: Club;
    index?: number;
    isActiveMember?: boolean;
}

export const ClubCard = ({ club, index = 0, isActiveMember = false }: ClubCardProps) => {
    const hasImage = !!club.image;
    const imageUrl = getImageUrl(club.image);
    const description = club.description ? stripHtmlToText(club.description) : null;

    return (
        <Card h="100%" padding="lg" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <CardSection
                pos="relative"
                h={244}
                style={{
                    overflow: 'hidden',
                    background: 'linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-purple-filled))',
                }}
            >
                {!hasImage ? (
                    <FallbackLogo
                        alt={club.name}
                        className="object-contain p-12 opacity-40 transition-all duration-500"
                        priority={index < 4}
                    />
                ) : (
                    <Image
                        src={imageUrl}
                        alt={club.name}
                        fill
                        className="object-cover transition-all duration-500"
                        unoptimized
                        priority={index < 4}
                    />
                )}
                <Box
                    pos="absolute"
                    inset={0}
                    style={{
                        pointerEvents: 'none',
                        background: 'linear-gradient(to top, rgba(0, 0, 0, 0.2), transparent)',
                    }}
                />
            </CardSection>

            <Stack flex={1} justify="space-between" pt="lg" gap="md">
                <Stack gap="sm">
                    <Title
                        order={3}
                        size="h3"
                        c="brand"
                        style={{ overflowWrap: 'break-word', hyphens: 'auto' }}
                    >
                        {club.name}
                    </Title>

                    {description && (
                        <Spoiler maxHeight={68} showLabel="Lees meer" hideLabel="Minder tonen">
                            <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-line' }}>
                                {description}
                            </Text>
                        </Spoiler>
                    )}
                </Stack>

                {(club.whatsapp_link || club.discord_link) && (
                    <Stack gap="xs" mt="auto">
                        {club.whatsapp_link && (
                            isActiveMember ? (
                                <Button
                                    component="a"
                                    href={club.whatsapp_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    fullWidth
                                    leftSection={<MessageCircle size={16} />}
                                >
                                    WhatsApp groep
                                </Button>
                            ) : (
                                <Button
                                    component={Link}
                                    href={ROUTES.MEMBERSHIP}
                                    fullWidth
                                    leftSection={<Lock size={16} />}
                                    title="Alleen zichtbaar voor leden met een actief lidmaatschap"
                                >
                                    Alleen voor leden
                                </Button>
                            )
                        )}

                        {club.discord_link && (
                            <Button
                                component="a"
                                href={club.discord_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                fullWidth
                                leftSection={<DiscordIcon className="size-4" />}
                            >
                                Discord
                            </Button>
                        )}
                    </Stack>
                )}
            </Stack>
        </Card>
    );
};
