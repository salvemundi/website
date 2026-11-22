import type { Metadata } from 'next';
import { connection } from 'next/server';
import { Button, Card, Container, Group, Stack, Title, VisuallyHidden } from '@mantine/core';
import ContactInfoCard from '@/components/ui/social/ContactInfoCard';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import {
    InstagramIcon as SiInstagram,
    FacebookIcon as SiFacebook,
    TiktokIcon as SiTiktok,
    LinkedinIcon as FaLinkedin
} from '@/shared/icons/social';

export const metadata: Metadata = {
    title: 'Contact | Salve Mundi',
    description:
        'Neem contact op met studievereniging Salve Mundi voor vragen, suggesties of informatie.',
    openGraph: {
        title: 'Contact | Salve Mundi',
        description:
            'Neem contact op met studievereniging Salve Mundi voor vragen, suggesties of informatie.',
    },
};

export default async function ContactPage() {
    return <ContactContent />;
}

async function ContactContent() {
    await connection();
    const [documenten, session] = await Promise.all([
        getDocumenten(),
        getEnrichedSession()
    ]);

    return (
        <Container size="lg" py="xl">
            <VisuallyHidden component="h1">Contact</VisuallyHidden>

            <Stack gap="xl">
                <ContactInfoCard
                    documenten={documenten}
                    isLoggedIn={!!session?.user}
                />

                <Card component="section" aria-labelledby="social-media-header" padding="xl">
                    <Stack gap="lg" align="center">
                        <Title id="social-media-header" order={2} ta="center" c="brand">
                            Volg Ons Op Social Media
                        </Title>

                        <Group justify="center" gap="md" wrap="wrap">
                            <Button
                                component="a"
                                href="https://www.instagram.com/sv.salvemundi/"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="md"
                                leftSection={<SiInstagram width={20} height={20} aria-hidden="true" />}
                            >
                                Instagram
                            </Button>
                            <Button
                                component="a"
                                href="https://www.facebook.com/sv.salvemundi/?locale=nl_NL"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="md"
                                leftSection={<SiFacebook width={20} height={20} aria-hidden="true" />}
                            >
                                Facebook
                            </Button>
                            <Button
                                component="a"
                                href="https://nl.linkedin.com/company/salve-mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="md"
                                leftSection={<FaLinkedin width={20} height={20} aria-hidden="true" />}
                            >
                                LinkedIn
                            </Button>
                            <Button
                                component="a"
                                href="https://www.tiktok.com/@salve.mundi"
                                target="_blank"
                                rel="noopener noreferrer"
                                size="md"
                                leftSection={<SiTiktok width={20} height={20} aria-hidden="true" />}
                            >
                                TikTok
                            </Button>
                        </Group>
                    </Stack>
                </Card>
            </Stack>
        </Container>
    );
}
