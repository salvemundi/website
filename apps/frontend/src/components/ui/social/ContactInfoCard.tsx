import React from 'react';
import { MapPin, Building, Mail, Phone, FileText, ChevronRight, MessageCircle } from 'lucide-react';
import { Anchor, Box, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import DocumentenLijst from '@/components/ui/social/DocumentenLijst';
import SafeHavenButton from '@/components/islands/social/SafeHavenButton';
import { ObfuscatedEmail } from '@/components/ui/security/ObfuscatedEmail';
import type { Document as WebsiteDocument } from '@salvemundi/validations/schema/website.zod';

interface ActionItemProps {
    icon: React.ReactNode;
    title: React.ReactNode;
    subtitle?: string;
    href?: string;
    children?: React.ReactNode;
}

function ActionItem({ icon, title, subtitle, href, children }: ActionItemProps) {
    const content = (
        <Group align="flex-start" gap="md" wrap="nowrap" py={6} px="xs">
            <Text span c="brand" lh={1} mt={3} style={{ flexShrink: 0 }}>
                {icon}
            </Text>
            <Stack gap={2} flex={1} miw={0}>
                <Text size="lg" fw={600} lh={1.3}>
                    {title}
                </Text>
                {subtitle && (
                    <Text size="md" c="dimmed">
                        {subtitle}
                    </Text>
                )}
            </Stack>
            {href && (
                <Text span c="brand" lh={1} mt={4} opacity={0.6}>
                    <ChevronRight size={16} />
                </Text>
            )}
        </Group>
    );

    return (
        <Stack gap={4}>
            {href ? (
                <Anchor
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    underline="never"
                    c="inherit"
                    w="fit-content"
                >
                    {content}
                </Anchor>
            ) : (
                <Box w="fit-content">{content}</Box>
            )}
            {children && <Box pl={44}>{children}</Box>}
        </Stack>
    );
}

export default function ContactInfoCard({ documenten, isLoggedIn }: { documenten: WebsiteDocument[]; isLoggedIn: boolean }) {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xl" w="100%">
            <Stack gap="lg">
                <Title order={2} size="h3" c="brand" px="xs">
                    Informatie
                </Title>

                <Stack gap="xs">
                    <ActionItem
                        icon={<MapPin size={20} />}
                        title="Rachelsmolen 1, Eindhoven"
                        subtitle="Gebouw R10, Lokaal 2.17"
                    />

                    <ActionItem
                        icon={<Building size={20} />}
                        title="KvK nummer 70280606"
                    />
                </Stack>

                <Box px="xs" pt="xs">
                    <Group gap="xs" mb="xs">
                        <Text span c="brand" lh={1}>
                            <FileText size={20} />
                        </Text>
                        <Title order={3} size="h5">
                            Documenten
                        </Title>
                    </Group>
                    <DocumentenLijst documenten={documenten} />
                </Box>
            </Stack>

            <Stack gap="lg">
                <Title order={2} size="h3" c="brand" px="xs">
                    Contact
                </Title>

                <Stack gap="xs">
                    <ActionItem
                        icon={<Mail size={20} />}
                        title={<ObfuscatedEmail email="info@salvemundi.nl" showIcon={false} />}
                    />

                    <ActionItem
                        icon={<Phone size={20} />}
                        title="+31 6 24827777"
                        href="tel:+31624827777"
                    />

                    {isLoggedIn && (
                        <ActionItem
                            icon={<MessageCircle size={20} />}
                            title="WhatsApp"
                            href="https://wa.me/31624827777"
                        />
                    )}
                </Stack>

                <SafeHavenButton />
            </Stack>
        </SimpleGrid>
    );
}
