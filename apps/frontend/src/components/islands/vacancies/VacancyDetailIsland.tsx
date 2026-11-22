'use client';

import Link from 'next/link';
import { Building2, MapPin, Calendar, Banknote, Clock, Briefcase, Mail, Globe, Phone, ChevronLeft } from 'lucide-react';
import { Anchor, AspectRatio, Badge, Box, Button, Card, Container, Divider, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import MediaAsset from '@/components/ui/media/MediaAsset';
import DocumentAsset from '@/components/ui/media/DocumentAsset';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import type { VacancyDTO } from '@salvemundi/validations';

interface VacancyDetailIslandProps {
    vacancy: VacancyDTO;
}

function formatPublishedDate(iso: string): string {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function VacancyDetailIsland({ vacancy }: VacancyDetailIslandProps) {
    const isInternship = vacancy.type === 'internship';

    return (
        <Container size="md" p={0}>
            <Stack gap="lg">
                <Box>
                    <Button
                        component={Link}
                        href="/bijbanenbank"
                        leftSection={<ChevronLeft size={18} />}
                    >
                        Terug
                    </Button>
                </Box>

                <Card padding={0} shadow="lg" withBorder style={{ overflow: 'hidden' }}>
                    {vacancy.image && (
                        <AspectRatio ratio={16 / 9} w="100%">
                            <MediaAsset asset={vacancy.image} alt={vacancy.title} fill objectFit="cover" priority />
                        </AspectRatio>
                    )}

                    <Stack gap="xl" p={{ base: 'lg', sm: 'xl' }}>
                        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                            <Stack gap="xs">
                                <Box>
                                    <Badge size="sm" color={isInternship ? 'brand' : 'success'}>
                                        {isInternship ? 'Stage' : 'Bijbaan'}
                                    </Badge>
                                </Box>
                                <Title order={1} fz={{ base: '1.5rem', sm: '2rem' }} c="brand">
                                    {vacancy.title}
                                </Title>
                                <Group gap="xs" c="dimmed">
                                    <Building2 size={16} />
                                    <Text fw={700}>{vacancy.company}</Text>
                                </Group>
                            </Stack>

                            <Button
                                component="a"
                                href={`mailto:${vacancy.contact_email}`}
                                size="md"
                                leftSection={<Mail size={16} />}
                            >
                                Solliciteer / Neem contact op
                            </Button>
                        </Group>

                        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                            <Group align="flex-start" gap="xs" wrap="nowrap">
                                <Text span c="brand" lh={1} mt={2}>
                                    <MapPin size={16} />
                                </Text>
                                <Stack gap={2}>
                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">Locatie</Text>
                                    <Text size="sm" fw={600}>{vacancy.location}</Text>
                                </Stack>
                            </Group>

                            {vacancy.salary && (
                                <Group align="flex-start" gap="xs" wrap="nowrap">
                                    <Text span c="brand" lh={1} mt={2}>
                                        <Banknote size={16} />
                                    </Text>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Salaris</Text>
                                        <Text size="sm" fw={600}>{vacancy.salary}</Text>
                                    </Stack>
                                </Group>
                            )}

                            {vacancy.employment_type && (
                                <Group align="flex-start" gap="xs" wrap="nowrap">
                                    <Text span c="brand" lh={1} mt={2}>
                                        <Briefcase size={16} />
                                    </Text>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Dienstverband/stagetype</Text>
                                        <Text size="sm" fw={600}>{vacancy.employment_type}</Text>
                                    </Stack>
                                </Group>
                            )}

                            {vacancy.working_hours && (
                                <Group align="flex-start" gap="xs" wrap="nowrap">
                                    <Text span c="brand" lh={1} mt={2}>
                                        <Clock size={16} />
                                    </Text>
                                    <Stack gap={2}>
                                        <Text size="xs" fw={700} tt="uppercase" c="dimmed">Werktijden</Text>
                                        <Text size="sm" fw={600}>{vacancy.working_hours}</Text>
                                    </Stack>
                                </Group>
                            )}
                        </SimpleGrid>

                        {isInternship && vacancy.directions.length > 0 && (
                            <Stack gap="xs">
                                <Title order={2} size="h6">ICT-richtingen</Title>
                                <Group gap="xs" wrap="wrap">
                                    {vacancy.directions.map((direction) => (
                                        <Badge key={direction} size="md">
                                            {direction}
                                        </Badge>
                                    ))}
                                </Group>
                            </Stack>
                        )}

                        {vacancy.skills.length > 0 && (
                            <Stack gap="xs">
                                <Title order={2} size="h6">Gewenste vaardigheden</Title>
                                <Group gap="xs" wrap="wrap">
                                    {vacancy.skills.map((skill) => (
                                        <Badge key={skill} size="md">
                                            {skill}
                                        </Badge>
                                    ))}
                                </Group>
                            </Stack>
                        )}

                        <Stack gap="xs">
                            <Title order={2} size="h6">Omschrijving</Title>
                            <SafeMarkdown content={vacancy.description} />
                        </Stack>

                        {vacancy.document && (
                            <Stack gap="xs">
                                <Title order={2} size="h6">Stageopdracht</Title>
                                <DocumentAsset id={vacancy.document} label="Download stageopdracht" />
                            </Stack>
                        )}

                        <Divider />

                        <Group gap="lg" wrap="wrap">
                            <Group gap="xs" c="dimmed">
                                <Calendar size={16} />
                                <Text size="sm" fw={600}>
                                    Geplaatst op {formatPublishedDate(vacancy.published_at)}
                                </Text>
                            </Group>
                            <Anchor href={`mailto:${vacancy.contact_email}`} size="sm" fw={600} c="brand">
                                <Group gap={6}>
                                    <Mail size={16} />
                                    <Text span inherit>{vacancy.contact_email}</Text>
                                </Group>
                            </Anchor>
                            {vacancy.contact_phone && (
                                <Anchor href={`tel:${vacancy.contact_phone}`} size="sm" fw={600} c="brand">
                                    <Group gap={6}>
                                        <Phone size={16} />
                                        <Text span inherit>{vacancy.contact_phone}</Text>
                                    </Group>
                                </Anchor>
                            )}
                            {vacancy.contact_website && (
                                <Anchor href={vacancy.contact_website} target="_blank" rel="noopener noreferrer" size="sm" fw={600} c="brand">
                                    <Group gap={6}>
                                        <Globe size={16} />
                                        <Text span inherit>Website</Text>
                                    </Group>
                                </Anchor>
                            )}
                        </Group>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
