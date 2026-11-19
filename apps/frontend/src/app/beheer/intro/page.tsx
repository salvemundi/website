import type { Metadata } from 'next';
import Link from '@/components/ui/Link';
import { ChevronLeft, QrCode } from 'lucide-react';
import { Badge, Button, Container, Group, Stack, Title } from '@mantine/core';
import IntroManagementIsland from '@/components/islands/beheer/IntroManagementIsland';
import {
    getIntroSignups,
    getIntroParentSignups,
    getIntroPlanning,
    getIntroConfidants,
    getIntroPlanningImage,
    getIntroInfoBooklet,
    getIntroQrScanCount,
    getIntroGroupsForBeheer,
    getApprovedOudersForPicker,
    getIntroSignupSettings
} from '@/server/actions/beheer/intro/beheer-intro-core.actions';
import { getIntroSettings } from '@/server/actions/public/intro.actions';
import { getIntroAttendanceVisible } from '@/server/actions/public/intro-attendance.actions';
import IntroVisibilityIsland from '@/components/islands/beheer/intro/IntroVisibilityIsland';
import IntroAttendanceVisibilityIsland from '@/components/islands/beheer/intro/IntroAttendanceVisibilityIsland';

export const metadata: Metadata = {
    title: 'Intro Beheer | SV Salve Mundi'
};

export default async function BeheerIntroPage() {
    const [signups, parents, planning, confidants, settings, planningImage, infoBooklet, qrScanCount, groups, approvedOuders, attendanceVisible, signupSettings] = await Promise.all([
        getIntroSignups(),
        getIntroParentSignups(),
        getIntroPlanning(),
        getIntroConfidants(),
        getIntroSettings(),
        getIntroPlanningImage(),
        getIntroInfoBooklet(),
        getIntroQrScanCount(),
        getIntroGroupsForBeheer(),
        getApprovedOudersForPicker(),
        getIntroAttendanceVisible(),
        getIntroSignupSettings(),
    ]);

    const introVisible = settings.show;

    return (
        <Container size="xl" py="lg">
            <Stack gap="lg">
                <Group justify="space-between" wrap="wrap" gap="md">
                    <Group gap="md" wrap="wrap">
                        <Button
                            component={Link}
                            href="/beheer"
                            variant="default"
                            size="sm"
                            leftSection={<ChevronLeft size={16} />}
                        >
                            Terug
                        </Button>
                        <Title order={1} size="h2" c="brand">
                            Introductie Beheer
                        </Title>
                        <Badge
                            variant="light"
                            color="brand"
                            size="lg"
                            leftSection={<QrCode size={14} />}
                        >
                            {qrScanCount.toLocaleString('nl-NL')} scans
                        </Badge>
                    </Group>

                    <Group gap="xs" wrap="wrap">
                        <IntroVisibilityIsland initialVisible={introVisible} />
                        <IntroAttendanceVisibilityIsland initialVisible={attendanceVisible} />
                    </Group>
                </Group>

                <IntroManagementIsland
                    initialSignups={signups}
                    initialParents={parents}
                    initialPlanning={planning}
                    initialConfidants={confidants}
                    initialGroups={groups}
                    initialApprovedOuders={approvedOuders}
                    initialIntroVisible={introVisible}
                    initialPlanningImage={planningImage}
                    initialInfoBooklet={infoBooklet}
                    initialStudentSignupsOpen={signupSettings.student_signups_open}
                    initialParentSignupsOpen={signupSettings.parent_signups_open}
                />
            </Stack>
        </Container>
    );
}

