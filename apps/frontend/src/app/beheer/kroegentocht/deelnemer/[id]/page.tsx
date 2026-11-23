import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import SignupForm from '@/components/islands/beheer/kroegentocht/SignupForm';
import { getPubCrawlSignup, getPubCrawlEvent } from '@/server/actions/beheer/kroegentocht/beheer-kroegentocht-core.actions';
import { notFound } from 'next/navigation';
import { unstable_noStore as noStore } from 'next/cache';

export async function generateMetadata({ params: _params }: { params: Promise<{ id: string }> }) {
    return {
        title: `Kroegentocht Deelnemer Beheer | Salve Mundi`
    };
}

interface DeelnemerPageProps {
    params: Promise<{ id: string }>;
}

export default async function DeelnemerPage({ params }: DeelnemerPageProps) {
    noStore();

    const { id } = await params;
    const signupId = parseInt(id);
    const signup = await getPubCrawlSignup(signupId).catch(() => null);

    if (!signup) notFound();

    const eventId = typeof signup.pub_crawl_event_id === 'object'
        ? Number(signup.pub_crawl_event_id.id)
        : Number(signup.pub_crawl_event_id);
    const event = await getPubCrawlEvent(eventId).catch(() => null);
    const rawGroups: unknown = event?.groups;
    const eventGroups = Array.isArray(rawGroups)
        ? rawGroups.map((g: unknown): string => {
            if (typeof g === 'string') return g;
            if (g && typeof g === 'object' && 'name' in g) {
                const nameVal = (g as { name?: unknown }).name;
                return typeof nameVal === 'string' ? nameVal : '';
            }
            return '';
        }).filter(Boolean)
        : [];

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer/kroegentocht"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Stack gap={2}>
                            <Title order={1} size="h2" c="brand">
                                Deelnemer Beheer
                            </Title>
                            <Text size="sm" c="dimmed">
                                Inschrijving van {signup.name}
                            </Text>
                        </Stack>
                    </Group>
                </Group>

                <SignupForm signup={signup} eventGroups={eventGroups} />
            </Stack>
        </Container>
    );
}
