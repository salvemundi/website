import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack } from '@mantine/core';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { getCameraPageData } from '@/server/actions/public/camera.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { CameraRequestIsland } from '@/components/islands/camera/CameraRequestIsland';

export const dynamic = 'force-dynamic';

export const metadata = {
    title: 'Fotograaf aanvraag | SV Salve Mundi',
    description: 'Vraag de verenigingscamera en eventueel een fotograaf aan voor een activiteit.',
};

export default async function CameraPage() {
    const session = await getEnrichedSession();
    if (!session) {
        redirect('/');
    }
    if (session.user.membership_status !== 'active') {
        redirect('/profiel');
    }

    const { events, committees, myCommitteeIds, photographers, mine } = await getCameraPageData();

    return (
        <PublicPageShell title="Fotograaf aanvraag">
            <Container size="xl" py="xl">
                <Stack gap="xl">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <Container size="md" p={0} w="100%">
                        <CameraRequestIsland
                            events={events}
                            committees={committees}
                            myCommitteeIds={myCommitteeIds}
                            photographers={photographers}
                            mine={mine}
                        />
                    </Container>
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
