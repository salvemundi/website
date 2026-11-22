import { connection } from 'next/server';
import { Lock, ShieldCheck, Mail, Info, ExternalLink } from 'lucide-react';
import { Anchor, Box, Card, Container, Flex, Group, SimpleGrid, Stack, Text, ThemeIcon, Title, VisuallyHidden } from '@mantine/core';
import { getReisSiteSettings, getUpcomingTrips, getUserTripSignup, getTripParticipantsCount, getCurrentUserProfileAction, getLatestPastTrip } from '@/server/actions/events/reis/reis-public.actions';
import { getDocumenten } from '@/server/actions/public/website.actions';
import { ReisFormIsland } from '@/components/islands/reis/ReisFormIsland';
import { ReisInfoIsland } from '@/components/islands/reis/ReisInfoIsland';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import PublicPageShell from '@/components/ui/layout/PublicPageShell';
import type { TripSignup } from '@salvemundi/validations/schema/trip.zod';
import type { EnrichedUser } from '@/types/auth';
import { formatDate } from '@/shared/lib/utils/date';
import { SafeMarkdown } from '@/components/ui/security/SafeMarkdown';
import MediaAsset from '@/components/ui/media/MediaAsset';

export const metadata = {
    title: 'Reis | Salve Mundi',
    description: 'Schrijf je in voor een reis van Salve Mundi!'
};

export default async function ReisPage() {
    await connection();

    const [trips, siteSettings, session, documents] = await Promise.all([
        getUpcomingTrips(),
        getReisSiteSettings(),
        getEnrichedSession(),
        getDocumenten()
    ]);

    const isReisEnabled = siteSettings?.show ?? true;
    const reisDisabledMessage = siteSettings?.disabled_message || 'De inschrijvingen voor de reis zijn momenteel gesloten.';
    const nextTrip = trips.length > 0 ? trips[0] : null;

    let participantsCount = 0;
    let userSignup: TripSignup | null = null;
    let currentUserProfile: EnrichedUser | null = null;

    if (nextTrip) {
        const [count, signup, profileResult] = await Promise.all([
            getTripParticipantsCount(nextTrip.id),
            getUserTripSignup(nextTrip.id),
            session?.user ? getCurrentUserProfileAction() : Promise.resolve(null)
        ]);

        participantsCount = count;
        userSignup = signup;

        if (profileResult && 'success' in profileResult && profileResult.success && profileResult.data) {
            currentUserProfile = profileResult.data as unknown as EnrichedUser;
        } else {
            currentUserProfile = session?.user ?? null;
        }
    }

    const registrationStartDate = nextTrip?.registration_start_date ? new Date(nextTrip.registration_start_date) : null;
    const now = new Date();

    const registrationDateReached = Boolean(registrationStartDate && now >= registrationStartDate);

    const canSignUp = Boolean(
        isReisEnabled &&
        nextTrip &&
        !nextTrip.allow_final_payments &&
        (nextTrip.registration_open || registrationDateReached)
    );

    const registrationStartText = !isReisEnabled
        ? reisDisabledMessage
        : (nextTrip?.allow_final_payments
            ? 'De inschrijvingen zijn gesloten omdat de betalingsfase is begonnen.'
            : (!canSignUp
                ? (registrationStartDate && now < registrationStartDate
                    ? `Inschrijving opent op ${formatDate(registrationStartDate, 'd MMMM yyyy HH:mm')}`
                    : 'De inschrijvingen voor deze reis zijn momenteel gesloten.')
                : 'Inschrijving geopend!'));

    const reisvoorwaardenDoc = documents.find(
        doc => doc.category?.toLowerCase() === 'reis' ||
               doc.title.toLowerCase().includes('reisvoorwaarde') ||
               doc.title.toLowerCase().includes('reisvoorwaarden')
    );
    const termsFileUrl = reisvoorwaardenDoc?.file ? `/api/assets/${reisvoorwaardenDoc.file}` : null;

    const showClosedLayout = !nextTrip || (!canSignUp && !userSignup);

    if (showClosedLayout) {
        const pastTrip = nextTrip ? null : await getLatestPastTrip();

        const isWaitingForDate = Boolean(
            nextTrip &&
            registrationStartDate &&
            now < registrationStartDate
        );

        const announcementTitle = isWaitingForDate ? 'Binnenkort Open' : 'Inschrijvingen Gesloten';
        const announcementMessage = nextTrip ? registrationStartText : reisDisabledMessage;

        const displayTrip = nextTrip || pastTrip;
        const displayTripImage = displayTrip?.image;
        const displayTripName = displayTrip?.name;
        const displayTripDescription = displayTrip?.description;
        const isPast = !nextTrip;

        const infoItems = [
            { icon: <ShieldCheck size={20} />, title: 'Lidmaatschap', content: <>Je hoeft <strong>geen lid</strong> te zijn om mee te gaan.</> },
            { icon: <Mail size={20} />, title: 'Bevestiging', content: <>Je krijgt direct een mail na je inschrijving.</> },
            { icon: <Info size={20} />, title: 'Leeftijd', content: <>Minimumleeftijd voor deelname is 18 jaar.</> },
            {
                icon: <ExternalLink size={20} />,
                title: 'Vragen?',
                content: (
                    <>
                        Mail ons op{' '}
                        <Anchor href="mailto:reis@salvemundi.nl" c="brand" fw={700}>
                            reis@salvemundi.nl
                        </Anchor>
                    </>
                )
            },
        ];

        return (
            <PublicPageShell>
                <VisuallyHidden component="h1">Reis</VisuallyHidden>
                <Container size="xl" py="xl">
                    <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl">
                        <Stack gap="lg">
                            <Card padding="xl">
                                <Stack align="center" ta="center" gap="md">
                                    <ThemeIcon size={64}>
                                        <Lock size={32} />
                                    </ThemeIcon>
                                    <Title order={2} c="brand">
                                        {announcementTitle}
                                    </Title>
                                    <Text c="dimmed" maw={480}>
                                        {announcementMessage}
                                    </Text>
                                </Stack>
                            </Card>

                            <Card padding="xl">
                                <Stack gap="lg">
                                    <Title order={3} c="brand">
                                        Goed om te weten
                                    </Title>

                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
                                        {infoItems.map((item) => (
                                            <Group key={item.title} align="flex-start" gap="md" wrap="nowrap">
                                                <ThemeIcon size={40}>
                                                    {item.icon}
                                                </ThemeIcon>
                                                <Stack gap={2}>
                                                    <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                                                        {item.title}
                                                    </Text>
                                                    <Text size="sm" fw={500}>
                                                        {item.content}
                                                    </Text>
                                                </Stack>
                                            </Group>
                                        ))}
                                    </SimpleGrid>
                                </Stack>
                            </Card>
                        </Stack>

                        <Stack gap="lg">
                            {displayTrip && (
                                <Card p={0} style={{ overflow: 'hidden' }}>
                                    {displayTripImage && (
                                        <Box pos="relative" h={{ base: 300, sm: 420 }} w="100%" bg="var(--mantine-color-body)">
                                            <MediaAsset
                                                asset={displayTripImage}
                                                alt={displayTripName ?? 'Reis'}
                                                fill
                                                objectFit="contain"
                                            />
                                        </Box>
                                    )}
                                    <Box p="xl">
                                        <Stack gap="md">
                                            <Title order={3} c="brand">
                                                {isPast
                                                    ? `Hoe was onze vorige Reis${displayTripName ? `: ${displayTripName}` : ''}?`
                                                    : displayTripName || 'Over de Reis'}
                                            </Title>
                                            <Box c="dimmed">
                                                {displayTripDescription ? (
                                                    <SafeMarkdown content={displayTripDescription} />
                                                ) : (
                                                    <Text c="dimmed">
                                                        Elk jaar organiseert de Reiscommissie van SV Salve Mundi een geweldige reis naar een prachtige bestemming in Europa. Tijdens deze reizen bezoeken we cultuurrijke locaties, lokale brouwerijen, en organiseren we gezellige activiteiten zoals een pubcrawl door de stad. Houd onze pagina en socials in de gaten voor de bekendmaking van de volgende reis!
                                                    </Text>
                                                )}
                                            </Box>
                                        </Stack>
                                    </Box>
                                </Card>
                            )}
                        </Stack>
                    </SimpleGrid>
                </Container>
            </PublicPageShell>
        );
    }

    return (
        <PublicPageShell>
            <VisuallyHidden component="h1">Reis</VisuallyHidden>
            <Container size="xl" py="xl">
                <Flex direction={{ base: 'column', lg: 'row' }} align="flex-start" gap="xl">
                    <ReisFormIsland
                        nextTrip={nextTrip}
                        userSignup={userSignup}
                        canSignUp={canSignUp}
                        registrationStartText={registrationStartText}
                        participantsCount={participantsCount}
                        initialUser={currentUserProfile}
                        termsFileUrl={termsFileUrl}
                    />
                    <ReisInfoIsland nextTrip={nextTrip} />
                </Flex>
            </Container>
        </PublicPageShell>
    );
}
