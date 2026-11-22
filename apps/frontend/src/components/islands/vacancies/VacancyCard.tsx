'use client';

import { useRouter } from 'next/navigation';
import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone, Lock } from 'lucide-react';
import { ActionIcon, AspectRatio, Badge, Box, Card, Center, Divider, Flex, Group, Stack, Text, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyCardProps {
    vacancy: VacancyDTO;
    variant?: 'grid' | 'list';
    isLoggedIn: boolean;
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyCard({ vacancy, variant = 'grid', isLoggedIn }: VacancyCardProps) {
    const router = useRouter();
    const isInternship = vacancy.type === 'internship';
    const isList = variant === 'list';

    if (!isLoggedIn) {
        const loginUrl = `/?needLogin=true&callbackURL=${encodeURIComponent('/bijbanenbank')}`;
        return (
            <Card
                onClick={() => router.push(loginUrl)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(loginUrl); }}
                padding={0}
                withBorder
                shadow="sm"
                style={{ cursor: 'pointer', overflow: 'hidden' }}
            >
                <Box style={{ display: 'flex', flexDirection: isList ? 'row' : 'column', flexWrap: 'wrap' }}>
                    <Box w={{ base: '100%', sm: isList ? 160 : '100%' }} style={{ flexShrink: 0, overflow: 'hidden' }}>
                        <AspectRatio ratio={16 / 9}>
                            {vacancy.image ? (
                                <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" />
                            ) : (
                                <Center h="100%" style={{ backgroundColor: 'var(--surface-subtle)' }}>
                                    <Text span c="brand" opacity={0.3} lh={1}>
                                        <Briefcase size={40} />
                                    </Text>
                                </Center>
                            )}
                        </AspectRatio>
                    </Box>
                    <Group justify="space-between" align="center" p="lg" gap="sm" style={{ flex: 1, minWidth: 0 }}>
                        <Title order={3} size="h4" c="brand" lineClamp={2}>
                            {vacancy.title}
                        </Title>
                        <Group gap={4} c="brand" style={{ flexShrink: 0 }}>
                            <Lock size={14} />
                            <Text size="xs" fw={700}>Inloggen</Text>
                        </Group>
                    </Group>
                </Box>
            </Card>
        );
    }

    return (
        <Card
            onClick={() => router.push(`/bijbanenbank/${vacancy.id}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/bijbanenbank/${vacancy.id}`); }}
            padding={0}
            withBorder
            shadow="sm"
            h="100%"
            style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
        >
            <Flex direction={{ base: 'column', md: isList ? 'row' : 'column' }} flex={1}>
                {vacancy.image && (
                    <Box w={{ base: '100%', md: isList ? 224 : '100%' }} style={{ flexShrink: 0, overflow: 'hidden' }}>
                        <AspectRatio ratio={16 / 9} h={isList ? '100%' : undefined}>
                            <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" />
                        </AspectRatio>
                    </Box>
                )}

                <Stack justify="space-between" gap="sm" p="lg" style={{ flex: 1, minWidth: 0 }}>
                    <Stack gap="sm">
                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
                            <Stack gap={4} style={{ minWidth: 0 }}>
                                <Title order={3} size="h4" c="brand" lineClamp={isList ? 1 : 2}>
                                    {vacancy.title}
                                </Title>
                                <Group gap={6} c="dimmed" wrap="nowrap">
                                    <Building2 size={14} style={{ flexShrink: 0 }} />
                                    <Text size="sm" fw={600} truncate>
                                        {vacancy.company}
                                    </Text>
                                </Group>
                            </Stack>
                            <Badge
                                size="sm"
                                color={isInternship ? 'brand' : 'success'}
                                style={{ flexShrink: 0 }}
                            >
                                {isInternship ? 'Stage' : 'Bijbaan'}
                            </Badge>
                        </Group>

                        <Text size="sm" c="dimmed" lineClamp={isList ? 2 : 3} component="div">
                            <SafeMarkdown content={vacancy.description} />
                        </Text>

                        <Group gap="md" wrap="wrap" c="dimmed">
                            <Group gap={4}>
                                <MapPin size={14} />
                                <Text size="xs" fw={500}>{vacancy.location}</Text>
                            </Group>
                            {vacancy.salary && (
                                <Group gap={4}>
                                    <Banknote size={14} />
                                    <Text size="xs" fw={500}>{vacancy.salary}</Text>
                                </Group>
                            )}
                            {vacancy.working_hours && (
                                <Group gap={4}>
                                    <Clock size={14} />
                                    <Text size="xs" fw={500}>{vacancy.working_hours}</Text>
                                </Group>
                            )}
                            {vacancy.employment_type && (
                                <Group gap={4}>
                                    <Briefcase size={14} />
                                    <Text size="xs" fw={500}>{vacancy.employment_type}</Text>
                                </Group>
                            )}
                        </Group>

                        {isInternship && vacancy.directions.length > 0 && (
                            <Group gap={6} wrap="wrap">
                                {vacancy.directions.map((direction) => (
                                    <Badge key={direction} size="xs">
                                        {direction}
                                    </Badge>
                                ))}
                            </Group>
                        )}

                        {vacancy.skills.length > 0 && (
                            <Group gap={6} wrap="wrap">
                                {vacancy.skills.slice(0, 6).map((skill) => (
                                    <Badge key={skill} size="xs">
                                        {skill}
                                    </Badge>
                                ))}
                                {vacancy.skills.length > 6 && (
                                    <Text size="xs" fw={700} c="dimmed">
                                        +{vacancy.skills.length - 6}
                                    </Text>
                                )}
                            </Group>
                        )}
                    </Stack>

                    <Stack gap="xs" mt="auto">
                        <Divider />
                        <Group justify="space-between" align="center" wrap="nowrap">
                            <Group gap={6} c="dimmed">
                                <Calendar size={14} />
                                <Text size="xs" fw={600} style={{ whiteSpace: 'nowrap' }}>
                                    {formatPublishedDate(vacancy.published_at)}
                                </Text>
                            </Group>
                            <Group gap="xs" wrap="nowrap">
                                {vacancy.contact_website && (
                                    <ActionIcon
                                        component="a"
                                        href={vacancy.contact_website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        size="md"
                                        title="Website"
                                        aria-label="Website"
                                    >
                                        <Globe size={16} />
                                    </ActionIcon>
                                )}
                                {vacancy.contact_phone && (
                                    <ActionIcon
                                        component="a"
                                        href={`tel:${vacancy.contact_phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        size="md"
                                        title="Bellen"
                                        aria-label="Bellen"
                                    >
                                        <Phone size={16} />
                                    </ActionIcon>
                                )}
                                <ActionIcon
                                    component="a"
                                    href={`mailto:${vacancy.contact_email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    size="md"
                                    title="E-mailen"
                                    aria-label="E-mailen"
                                >
                                    <Mail size={16} />
                                </ActionIcon>
                            </Group>
                        </Group>
                    </Stack>
                </Stack>
            </Flex>
        </Card>
    );
}
