import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { redirect } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { getIntroAttendanceAccess, getAttendanceGroupsForUser } from '@/server/actions/public/intro-attendance.actions';
import IntroAttendanceIsland from '@/components/islands/account/intro/IntroAttendanceIsland';

export const metadata: Metadata = {
    title: 'Groepje Aanwezigheid | SV Salve Mundi'
};

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function IntroAttendancePage({ searchParams }: Props) {
    const { isCrew, ledGroupIds } = await getIntroAttendanceAccess();

    if (!isCrew && ledGroupIds.length === 0) {
        redirect('/profiel');
    }

    const resolvedSearchParams = await searchParams;
    const groupParam = typeof resolvedSearchParams.group === 'string' ? Number(resolvedSearchParams.group) : undefined;
    const initialGroupId = groupParam !== undefined && !Number.isNaN(groupParam) ? groupParam : null;

    const groups = await getAttendanceGroupsForUser();

    return (
        <Container size="xl" py="xl">
            <Stack gap="xl">
                <Stack component="header" gap="md">
                    <Group>
                        <Button
                            component={Link}
                            href="/profiel"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                    </Group>
                    <Title order={1}>Groepje Aanwezigheid</Title>
                    <Text size="lg" c="dimmed" maw={720}>
                        Houd per dag bij wie er aanwezig is en wie er &apos;s avonds al naar huis is.
                    </Text>
                </Stack>

                <IntroAttendanceIsland groups={groups} isCrew={isCrew} initialGroupId={initialGroupId} />
            </Stack>
        </Container>
    );
}
