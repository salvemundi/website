import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft } from 'lucide-react';
import { Button, Card, Container, Group, Stack, Text, Title } from '@mantine/core';
import NdaSignIsland from '@/components/islands/nda/NdaSignIsland';
import { getMyNdaToSign } from '@/server/actions/nda/member-nda.actions';

export const metadata: Metadata = {
    title: 'NDA Ondertekenen | SV Salve Mundi'
};

export default async function SignNdaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const nda = await getMyNdaToSign(Number(id));

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack component="header" gap="md">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel/nda"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug naar mijn NDA&apos;s
                        </Button>
                    </Group>
                    <Title order={1}>NDA Ondertekenen</Title>
                </Stack>

                <Container size="sm" p={0} w="100%">
                    {'error' in nda ? (
                        <Card padding="xl">
                            <Text c="dimmed" ta="center">{nda.error}</Text>
                        </Card>
                    ) : (
                        <NdaSignIsland
                            signatureId={nda.signatureId}
                            committeeName={nda.committeeName}
                            documentFileId={nda.documentFileId}
                        />
                    )}
                </Container>
            </Stack>
        </Container>
    );
}
