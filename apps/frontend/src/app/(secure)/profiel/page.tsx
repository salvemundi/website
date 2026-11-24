import React from 'react';
import Link from '@/components/ui/Link';
import { ClipboardCheck, ArrowRight, FileSignature, Sparkles } from 'lucide-react';
import { Anchor, Card, Container, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';
import { getMyProfileView, getUserEventSignups, getUserPubCrawlSignups } from '@/server/actions/profile/profiel.actions';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import { getIntroAttendanceAccess, getIntroAttendanceVisible } from '@/server/actions/public/intro-attendance.actions';
import { getMyNdas } from '@/server/actions/nda/member-nda.actions';
import { getBorrelBarClaimStatus } from '@/server/actions/profile/borrelbar-claim.actions';
import { getSamuWrappedVisible } from '@/server/actions/profile/samu-wrapped.actions';

export const metadata = {
    title: 'Mijn Profiel | SV Salve Mundi',
    description: 'Beheer je lidmaatschap, bekijk je aanmeldingen en pas je gegevens aan.'
};

export default async function ProfielPage() {
    const [eventSignups, pubCrawlSignups, profile, attendanceVisible, attendanceAccess, ndas, borrelBarClaimStatus, wrappedVisible] = await Promise.all([
        getUserEventSignups(),
        getUserPubCrawlSignups(),
        getMyProfileView(),
        getIntroAttendanceVisible(),
        getIntroAttendanceAccess(),
        getMyNdas(),
        getBorrelBarClaimStatus(),
        getSamuWrappedVisible()
    ]);

    const hasIntroAttendanceAccess = attendanceAccess.isCrew || attendanceAccess.ledGroupIds.length > 0;
    const showIntroAttendanceBanner = attendanceVisible && hasIntroAttendanceAccess;
    const pendingNdaCount = ndas.filter((n) => n.status === 'pending').length;

    return (
        <PublicPageShell title="Mijn Profiel">
            <Container size="xl" py="xl">
                <Stack gap="lg">
                    {wrappedVisible && (
                        <Anchor component={Link} href="/profiel/wrapped" underline="never">
                            <Card
                                c="white"
                                style={{ background: 'linear-gradient(120deg, #F8CF45 0%, #e05b8a 45%, #5A3761 100%)' }}
                            >
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap">
                                        <ThemeIcon size={48} variant="white" color="dark">
                                            <Sparkles size={22} />
                                        </ThemeIcon>
                                        <Stack gap={2}>
                                            <Text fw={900} size="lg">Jouw Samu Wrapped staat klaar!</Text>
                                            <Text size="sm" opacity={0.85}>
                                                Bekijk jouw jaar bij Salve Mundi in cijfers
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <ArrowRight size={20} />
                                </Group>
                            </Card>
                        </Anchor>
                    )}

                    {pendingNdaCount > 0 && (
                        <Anchor component={Link} href="/profiel/nda" underline="never">
                            <Card>
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap">
                                        <ThemeIcon size="lg" color="accent">
                                            <FileSignature size={22} />
                                        </ThemeIcon>
                                        <Stack gap={2}>
                                            <Text fw={900} size="lg">
                                                {pendingNdaCount === 1
                                                    ? 'Je hebt een NDA om te ondertekenen'
                                                    : `Je hebt ${pendingNdaCount} NDA's om te ondertekenen`}
                                            </Text>
                                            <Text size="sm" c="dimmed">
                                                Geheimhoudingsverklaring(en) wachten op jouw handtekening
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <ThemeIcon size="lg" color="accent">
                                        <ArrowRight size={18} />
                                    </ThemeIcon>
                                </Group>
                            </Card>
                        </Anchor>
                    )}

                    {showIntroAttendanceBanner && (
                        <Anchor component={Link} href="/profiel/intro-attendance" underline="never">
                            <Card>
                                <Group justify="space-between" wrap="nowrap" gap="md">
                                    <Group gap="md" wrap="nowrap">
                                        <ThemeIcon size="lg">
                                            <ClipboardCheck size={22} />
                                        </ThemeIcon>
                                        <Stack gap={2}>
                                            <Text fw={900} size="lg">Intro Aanwezigheid</Text>
                                            <Text size="sm" c="dimmed">
                                                Beheer wie er aanwezig is in je groepje
                                            </Text>
                                        </Stack>
                                    </Group>
                                    <ThemeIcon size="lg">
                                        <ArrowRight size={18} />
                                    </ThemeIcon>
                                </Group>
                            </Card>
                        </Anchor>
                    )}

                    {profile && (
                        <ProfielIsland
                            profile={profile}
                            initialSignups={eventSignups}
                            pubCrawlSignups={pubCrawlSignups}
                            borrelBarClaimStatus={borrelBarClaimStatus}
                        />
                    )}
                </Stack>
            </Container>
        </PublicPageShell>
    );
}
