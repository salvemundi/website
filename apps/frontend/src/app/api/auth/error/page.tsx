import Link from '@/components/ui/Link';
import { AlertTriangle, Home } from 'lucide-react';
import { Button, Card, Center, Container, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function Page() {
    return (
        <Container size="xs" py="xl">
            <Center mih="75vh">
                <Card w="100%" padding="xl">
                    <Stack align="center" ta="center" gap="lg">
                        <ThemeIcon size="xl" color="error">
                            <AlertTriangle size={32} />
                        </ThemeIcon>

                        <Title order={1} size="h2">
                            Login Mislukt
                        </Title>

                        <Text c="dimmed">
                            Er is een fout opgetreden tijdens het inloggen. Probeer het opnieuw of neem contact op met de ICT-commissie voor ondersteuning.
                        </Text>

                        <Button
                            component={Link}
                            href="/"
                            fullWidth
                            size="md"
                            leftSection={<Home size={16} />}
                        >
                            Terug naar Home
                        </Button>
                    </Stack>
                </Card>
            </Center>
        </Container>
    );
}
