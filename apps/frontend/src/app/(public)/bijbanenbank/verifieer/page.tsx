import Link from '@/components/ui/Link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button, Card, Container, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { verifySubmission } from '@/server/actions/vacancies/vacancies-submission.actions';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Vacature Verifiëren | SV Salve Mundi'
};

interface VerifyPageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function VerifyVacancyPage({ searchParams }: VerifyPageProps) {
    const { token } = await searchParams;
    const result = token ? await verifySubmission(token) : { success: false, error: 'Geen verificatietoken opgegeven.' };

    return (
        <Container size="sm" py="xl">
            <Card padding="xl">
                <Stack gap="lg" align="flex-start">
                    <Group gap="sm">
                        <ThemeIcon
                            size="lg"
                            color={result.success ? 'success' : 'error'}
                        >
                            {result.success ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                        </ThemeIcon>
                        <Title order={1} size="h2" c="brand">
                            {result.success ? 'E-mailadres geverifieerd' : 'Verificatie mislukt'}
                        </Title>
                    </Group>

                    <Text>
                        {result.success
                            ? 'Bedankt! Je e-mailadres is geverifieerd en je vacature staat nu klaar voor beoordeling door onze commissie. Zodra deze is goedgekeurd, verschijnt hij op de website en ontvang je hiervan een bevestiging per e-mail.'
                            : (result.error || 'Deze verificatielink is ongeldig.')}
                    </Text>

                    <Button
                        component={Link}
                        href={result.success ? '/' : '/bijbanenbank/plaatsen'}
                    >
                        {result.success ? 'Terug naar de homepage' : 'Opnieuw aanmelden'}
                    </Button>
                </Stack>
            </Card>
        </Container>
    );
}
