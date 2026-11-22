import { Badge, Box, Button, Container, Divider, Grid, GridCol, Group, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import Image from 'next/image';
import Link from '@/components/ui/Link';
import { Mail, Users, History, LayoutGrid } from 'lucide-react';
import { type Committee } from '@salvemundi/validations/schema/committees.zod';
import { getImageUrl } from '@/lib/utils/image-utils';
import { FallbackLogo } from '@/components/ui/media/FallbackLogo';

interface CommitteeDetailProps {
    committee: Committee;
}

export const CommitteeDetail = ({ committee }: CommitteeDetailProps) => {
    const cleanedName = committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || 'Commissie';
    const isBestuur = cleanedName.toLowerCase().includes('bestuur');

    const members = (committee.members?.filter((m) => m.is_visible) || []).sort((a, b) => {
        if (a.is_leader && !b.is_leader) return -1;
        if (!a.is_leader && b.is_leader) return 1;
        return 0;
    });

    return (
        <Container size="xl" py="md">
            <Stack gap="xl">
                <Grid gap="xl" align="center">
                    <GridCol span={{ base: 12, md: 7 }} order={{ base: 2, md: 1 }}>
                        <Stack gap="lg" align="flex-start">
                            <Title order={1} c="brand" fz={{ base: '2rem', md: '3rem' }}>
                                {cleanedName}
                            </Title>

                            <Text size="lg" c="dimmed" maw={640}>
                                {committee.description || `De ${cleanedName} van Salve Mundi zet zich dagelijks in om de vereniging naar een hoger niveau te tillen en memorabele momenten te creëren voor al onze leden.`}
                            </Text>

                            <Group gap="md" wrap="wrap">
                                {committee.email && (
                                    <Button
                                        component="a"
                                        href={`mailto:${committee.email}`}
                                        size="lg"
                                        leftSection={<Mail size={18} />}
                                    >
                                        Interesse? Mail ons!
                                    </Button>
                                )}

                                {isBestuur ? (
                                    <Button
                                        component={Link}
                                        href="/commissies/oud-besturen"
                                        size="lg"
                                        leftSection={<History size={18} />}
                                    >
                                        Geschiedenis
                                    </Button>
                                ) : (
                                    <Button
                                        component={Link}
                                        href="/contact"
                                        size="lg"
                                        leftSection={<LayoutGrid size={18} />}
                                    >
                                        Andere vragen?
                                    </Button>
                                )}
                            </Group>
                        </Stack>
                    </GridCol>

                    <GridCol span={{ base: 12, md: 5 }} order={{ base: 1, md: 2 }}>
                        <Box pos="relative" w="100%" maw={420} mx="auto" style={{ aspectRatio: '1 / 1' }}>
                            {committee.image ? (
                                <Image
                                    src={getImageUrl(committee.image)}
                                    alt={cleanedName}
                                    fill
                                    className="object-contain"
                                    style={{ filter: 'drop-shadow(0 20px 40px color-mix(in srgb, var(--mantine-color-brand-filled) 30%, transparent))' }}
                                    priority
                                />
                            ) : (
                                <Box pos="relative" w="100%" h="100%" style={{ opacity: 0.6 }}>
                                    <FallbackLogo
                                        className="object-contain"
                                    />
                                </Box>
                            )}
                        </Box>
                    </GridCol>
                </Grid>

                <Divider />

                <Stack gap="xl" pt="md">
                    <Stack align="center" gap="sm">
                        <Group gap="sm">
                            <ThemeIcon size="xl">
                                <Users size={24} />
                            </ThemeIcon>
                            <Title order={2} c="brand">
                                {isBestuur ? 'Het Bestuur' : 'De Commissie'}
                            </Title>
                        </Group>
                    </Stack>

                    <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="xl">
                        {members.map((member, idx) => {
                            const name = member.user_id?.first_name ? `${member.user_id.first_name} ${member.user_id.last_name || ''}` : 'Lid';
                            const roleLabel = member.is_leader
                                ? (isBestuur ? member.user_id?.title : 'Commissieleider')
                                : (isBestuur ? (member.user_id?.title || 'Bestuurslid') : 'Commissielid');

                            return (
                                <Stack key={idx} align="center" gap="sm">
                                    <Box
                                        pos="relative"
                                        w={144}
                                        h={144}
                                        bg="var(--mantine-color-default)"
                                        style={{
                                            overflow: 'hidden',
                                            borderRadius: 'var(--mantine-radius-xl)',
                                            boxShadow: 'var(--mantine-shadow-lg)',
                                        }}
                                    >
                                        {member.user_id?.avatar ? (
                                            <Image
                                                src={getImageUrl(member.user_id.avatar)}
                                                alt={name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <Box pos="relative" w="100%" h="100%" p="md" style={{ opacity: 0.45 }}>
                                                <FallbackLogo className="object-contain" />
                                            </Box>
                                        )}
                                    </Box>
                                    <Title order={3} size="h4" ta="center">
                                        {name}
                                    </Title>
                                    <Badge size="sm">
                                        {roleLabel}
                                    </Badge>
                                </Stack>
                            );
                        })}
                    </SimpleGrid>
                </Stack>
            </Stack>
        </Container>
    );
};
