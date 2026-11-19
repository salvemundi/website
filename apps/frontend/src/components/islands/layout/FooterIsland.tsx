import React from 'react';
import Link from '@/components/ui/Link';
import {
    ActionIcon,
    Anchor,
    Box,
    Button,
    Center,
    Container,
    Grid,
    GridCol,
    Group,
    SimpleGrid,
    Stack,
    Text,
    Title,
} from '@mantine/core';
import ActiveLink from '@/components/ui/ActiveLink';
import {
    InstagramIcon as SiInstagram,
    FacebookIcon as SiFacebook,
    TiktokIcon as SiTiktok,
    LinkedinIcon as FaLinkedin,
} from '@/shared/icons/social';
import { getPublicNavRoutes, ROUTES } from '@/lib/config/routes';
import type { Committee } from '@salvemundi/validations/schema/committees.zod';
import type { Document } from '@salvemundi/validations/schema/website.zod';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import { type ExtendedSession } from '@/types/auth';

interface FooterIslandProps {
    documents: Document[];
    disabledRoutes?: string[];
    committees: Committee[];
    initialSession?: ExtendedSession | null;
}

function cleanCommitteeName(name: string): string {
    return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim();
}

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}

interface FooterSectionProps {
    title: string;
    action?: React.ReactNode;
    children: React.ReactNode;
}

function FooterSection({ title, action, children }: FooterSectionProps) {
    return (
        <Stack gap="xs" align="center" w="100%">
            <Title order={3} size="xs" tt="uppercase" ta="center" w="100%" style={{ letterSpacing: '0.2em' }}>
                {title}
            </Title>
            <Box w="100%" maw={360}>
                {children}
            </Box>
            {action && (
                <Center w="100%" pt={2}>
                    {action}
                </Center>
            )}
        </Stack>
    );
}

const FooterIsland: React.FC<FooterIslandProps> = async ({
    documents,
    disabledRoutes = [],
    committees,
    initialSession,
}) => {
    const isAuthenticated = !!initialSession?.user;
    const assetUrl = '/api/assets';

    const pageLinks = getPublicNavRoutes(disabledRoutes);

    const sortedCommittees = [...committees].sort((a, b) => {
        const aIsBestuur = cleanCommitteeName(a.name).toLowerCase().includes('bestuur');
        const bIsBestuur = cleanCommitteeName(b.name).toLowerCase().includes('bestuur');

        if (aIsBestuur && !bIsBestuur) return -1;
        if (!aIsBestuur && bIsBestuur) return 1;
        return 0;
    });

    return (
        <Box component="footer" pos="relative" bg="var(--mantine-color-default)" style={{ overflow: 'hidden' }}>
            <Container size="xl" pt="lg" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
                <Grid columns={12} gap="lg" align="flex-start">
                    <GridCol span={{ base: 12, sm: 6, lg: 2 }}>
                        <FooterSection title="Informatie">
                            <Stack gap={6} align="center" component="ul">
                                <Text component="li" size="sm" c="dimmed" ta="center">Rachelsmolen 1</Text>
                                <Text component="li" size="sm" c="dimmed" ta="center">5612 MA Eindhoven</Text>
                                <Text component="li" size="sm" c="dimmed" ta="center">KvK nr. 70280606</Text>
                                {documents.map((doc) => (
                                    <li key={doc.id}>
                                        <Anchor
                                            href={`${assetUrl}/${doc.file}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            size="sm"
                                            c="dimmed"
                                            mod={{ 'footer-link': true, 'footer-doc': true }}
                                            underline="never"
                                            title={doc.description !== null ? doc.description : undefined}
                                        >
                                            {doc.title}
                                        </Anchor>
                                    </li>
                                ))}
                            </Stack>
                        </FooterSection>
                    </GridCol>

                    <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
                        <FooterSection title="Pagina's">
                            <SimpleGrid cols={2} spacing="xs" verticalSpacing={6} role="list">
                                {pageLinks.map((link) => (
                                    <Box key={link.href} ta="center" role="listitem">
                                        <ActiveLink
                                            href={link.href}
                                            data-footer-link=""
                                        >
                                            {link.name}
                                        </ActiveLink>
                                    </Box>
                                ))}
                            </SimpleGrid>
                        </FooterSection>
                    </GridCol>

                    <GridCol span={{ base: 12, sm: 6, lg: 4 }}>
                        <FooterSection
                            title="Commissies"
                            action={
                                <Button
                                    component={Link}
                                    href={ROUTES.COMMITTEES}
                                    size="xs"
                                    variant="light"
                                    color="brand"
                                >
                                    Alle commissies bekijken
                                </Button>
                            }
                        >
                            <SimpleGrid cols={2} spacing="xs" verticalSpacing={6} role="list">
                                {sortedCommittees.slice(0, 12).map((committee) => {
                                    const cleaned = cleanCommitteeName(committee.name);
                                    const slug = slugify(cleaned);
                                    return (
                                        <Box key={committee.id} ta="center" role="listitem">
                                            <ActiveLink
                                                href={`${ROUTES.COMMITTEES}/${slug}`}
                                                data-footer-link=""
                                            >
                                                {cleaned}
                                            </ActiveLink>
                                        </Box>
                                    );
                                })}
                            </SimpleGrid>
                        </FooterSection>
                    </GridCol>

                    <GridCol span={{ base: 12, sm: 6, lg: 3 }}>
                        <Stack gap="md">
                            <FooterSection
                                title="Contact"
                                action={
                                    <Button
                                        component={Link}
                                        href={ROUTES.SAFE_HAVENS}
                                        size="xs"
                                        variant="light"
                                        color="brand"
                                    >
                                        Safe Havens
                                    </Button>
                                }
                            >
                                <Stack gap={6} align="center" component="ul">
                                    <li>
                                        <ObfuscatedEmail
                                            email="info@salvemundi.nl"
                                            footerLink
                                            showIcon={false}
                                        />
                                    </li>
                                    <li>
                                        <Anchor href="tel:+31624827777" size="sm" c="dimmed" underline="never" mod={{ 'footer-link': true }}>
                                            +31 6 24827777
                                        </Anchor>
                                    </li>

                                    {isAuthenticated && (
                                        <li>
                                            <Anchor
                                                href="https://wa.me/31624827777"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                size="sm"
                                                c="dimmed"
                                                underline="never"
                                                mod={{ 'footer-link': true }}
                                            >
                                                WhatsApp
                                            </Anchor>
                                        </li>
                                    )}
                                </Stack>
                            </FooterSection>

                            <FooterSection title="Social Media">
                                <Group gap="sm" justify="center">
                                    <ActionIcon
                                        component="a"
                                        href="https://www.instagram.com/sv.salvemundi/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="lg"
                                        variant="light"
                                        color="brand"
                                        aria-label="Instagram"
                                    >
                                        <SiInstagram className="size-5" />
                                    </ActionIcon>
                                    <ActionIcon
                                        component="a"
                                        href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="lg"
                                        variant="light"
                                        color="brand"
                                        aria-label="Facebook"
                                    >
                                        <SiFacebook className="size-5" />
                                    </ActionIcon>
                                    <ActionIcon
                                        component="a"
                                        href="https://nl.linkedin.com/company/salve-mundi"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="lg"
                                        variant="light"
                                        color="brand"
                                        aria-label="LinkedIn"
                                    >
                                        <FaLinkedin className="size-5" />
                                    </ActionIcon>
                                    <ActionIcon
                                        component="a"
                                        href="https://www.tiktok.com/@salve.mundi"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        size="lg"
                                        variant="light"
                                        color="brand"
                                        aria-label="TikTok"
                                    >
                                        <SiTiktok className="size-5" />
                                    </ActionIcon>
                                </Group>
                            </FooterSection>
                        </Stack>
                    </GridCol>
                </Grid>

                <Text size="sm" c="dimmed" ta="center" mt="md">
                    Copyright © 2026 Salve Mundi — alle rechten voorbehouden.{' '}
                    <Anchor
                        href="https://github.com/salvemundi/website"
                        target="_blank"
                        rel="noopener noreferrer"
                        size="sm"
                        c="brand"
                    >
                        Source code
                    </Anchor>
                </Text>
            </Container>
        </Box>
    );
};

export default FooterIsland;
