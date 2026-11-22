import NextLink from '@/components/ui/Link';
import Image from 'next/image';
import { ChevronRight, Users, History } from 'lucide-react';
import {
    Anchor,
    Badge,
    Box,
    Button,
    Card,
    CardSection,
    Divider,
    Group,
    Stack,
    Text,
    ThemeIcon,
    Title,
} from '@mantine/core';
import { getImageUrl } from '@/lib/utils/image-utils';
import { slugify } from '@/shared/lib/utils/slug';
import type { Committee } from '@salvemundi/validations/schema/committees.zod';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface CommitteeCardProps {
    committee?: Committee;
    index?: number;
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || '';
}

export const CommitteeCard = ({
    committee = {} as Committee,
    index = 0,
}: CommitteeCardProps) => {
    const cleanedName = cleanCommitteeName(committee.name || '');
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');
    const slug = committee.commissie_token || slugify(cleanedName);

    const members = (committee.members || [])
        .filter((m) => m.is_visible && m.user_id?.avatar)
        .map((m) => ({
            avatar: m.user_id?.avatar ? getImageUrl(m.user_id.avatar) : '',
            name: m.user_id?.first_name || '',
            isLeader: m.is_leader,
        }));

    const hasHistory = (committee as Committee & { has_history?: boolean }).has_history ?? false;
    const hasImage = !!committee.image;
    const imageUrl = getImageUrl(committee.image);

    return (
        <Anchor component={NextLink} href={`/commissies/${slug}`} underline="never" h="100%" display="block">
            <Card
                h="100%"
                padding="lg"
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    outline: isBestuur ? '3px solid var(--mantine-color-brand-light)' : undefined,
                }}
            >
                <CardSection
                    pos="relative"
                    h={isBestuur ? 300 : 244}
                    style={{
                        overflow: 'hidden',
                        background: 'linear-gradient(135deg, var(--mantine-color-brand-light), var(--mantine-color-purple-filled))',
                    }}
                >
                    {hasImage && isBestuur && (
                        <Image
                            src={imageUrl}
                            alt=""
                            fill
                            className="object-cover"
                            style={{ pointerEvents: 'none', opacity: 0.25, filter: 'blur(24px)', userSelect: 'none' }}
                        />
                    )}
                    {!hasImage ? (
                        <Box pos="relative" w="100%" h="100%" p={48} style={{ opacity: 0.4 }}>
                            <FallbackLogo
                                alt={committee.name || 'Committee'}
                                className="object-contain"
                                priority={index < 4}
                            />
                        </Box>
                    ) : (
                        <Image
                            src={imageUrl}
                            alt={committee.name || 'Committee'}
                            fill
                            className={isBestuur ? 'object-contain' : 'object-cover'}
                            priority={index < 4}
                        />
                    )}
                    <Box
                        pos="absolute"
                        inset={0}
                        style={{
                            pointerEvents: 'none',
                            background: 'linear-gradient(to top, var(--overlay-scrim-subtle), transparent)',
                        }}
                    />

                    {isBestuur && (
                        <Badge pos="absolute" top={16} right={16} size="md">
                            Huidig Bestuur
                        </Badge>
                    )}
                </CardSection>

                <Stack flex={1} justify="space-between" pt="lg" gap="md">
                    <Stack gap="sm">
                        <Box>
                            <Title
                                order={3}
                                size="h3"
                                c="brand"
                                style={{ overflowWrap: 'break-word', hyphens: 'auto' }}
                            >
                                {cleanedName || 'Commissie'}
                            </Title>

                            <Group gap="xs" mt={6}>
                                <Group gap={0}>
                                    {members.slice(0, 3).map((member, i) => (
                                        <Box
                                            key={i}
                                            pos="relative"
                                            w={24}
                                            h={24}
                                            ml={i > 0 ? -8 : 0}
                                            bg="var(--mantine-color-body)"
                                            style={{
                                                overflow: 'hidden',
                                                borderRadius: '9999px',
                                                border: '2px solid var(--mantine-color-default)',
                                            }}
                                        >
                                            {member.avatar ? (
                                                <Image src={member.avatar} alt="Member" fill className="object-cover" />
                                            ) : (
                                                <FallbackLogo alt="Member" className="object-cover" />
                                            )}
                                        </Box>
                                    ))}
                                </Group>
                                <Group gap={6}>
                                    <Text span c="dimmed" lh={1}>
                                        <Users size={12} />
                                    </Text>
                                    <Text size="xs" fw={600} c="dimmed">
                                        {committee.members?.length || 0} Leden
                                    </Text>
                                </Group>
                            </Group>
                        </Box>

                        <Text size="sm" c="dimmed" lineClamp={3}>
                            {committee.short_description || `Maak kennis met de ${cleanedName} van SV Salve Mundi.`}
                        </Text>
                    </Stack>

                    <Stack gap="sm" mt="auto">
                        <Divider />
                        <Group justify="space-between" align="center">
                            <Button
                                component="div"
                                size="sm"
                                rightSection={<ChevronRight size={14} />}
                            >
                                Meer informatie
                            </Button>

                            {hasHistory && !isBestuur && (
                                <ThemeIcon size="lg" title="Historie">
                                    <History size={18} />
                                </ThemeIcon>
                            )}
                        </Group>
                    </Stack>
                </Stack>
            </Card>
        </Anchor>
    );
};
