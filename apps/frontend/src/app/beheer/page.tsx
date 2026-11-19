import { Box, Container, Grid, GridCol, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import BeheerUnauthorized from '@/components/ui/beheer/BeheerUnauthorized';
import {
    DashboardHub,
    BirthdaysList,
    TopStickersList,
    ActivitySignupsList
} from '@/components/ui/beheer/dashboard/DashboardSections';
import { checkBeheerAccess } from '@/server/actions/beheer/beheer-utils.actions';
import {
    getDashboardPermissions,
    getDashboardStats,
    getUpcomingBirthdays,
    getRecentActivities,
    getTopStickers
} from '@/server/actions/public/dashboard.actions';
import { COMMITTEES } from '@/shared/lib/permissions-config';

export const metadata = {
    title: 'Beheer Dashboard | SV Salve Mundi'
};

export default async function BeheerPage() {
    const access = await checkBeheerAccess().catch(() => null);
    if (!access || !access.user || !access.isAuthorized) {
        return (
            <BeheerUnauthorized
                title="Beheerderspaneel Fout"
                description="Je hebt geen toegang tot het beheerderspaneel."
            />
        );
    }

    const [
        permissions,
        stats,
        birthdays,
        activities,
        stickers
    ] = await Promise.all([
        getDashboardPermissions(),
        getDashboardStats(),
        getUpcomingBirthdays(),
        getRecentActivities(),
        getTopStickers()
    ]);

    const allPermissions = [
        permissions.includes('intro'),
        permissions.includes('reis'),
        permissions.includes('logging'),
        permissions.includes('sync'),
        permissions.includes('coupons'),
        permissions.includes('stickers'),
        permissions.includes('kroegentocht'),
        permissions.includes('cobo'),
        permissions.includes('camera'),
        permissions.includes('webshop'),
        permissions.includes('vacatures')
    ];
    const visibleCount = allPermissions.filter(Boolean).length;
    const isLimitedAccess = visibleCount <= 2;

    const isIct = permissions.includes('ict');
    const isBestuur = access.user.committees.some(c => c.azure_group_id === COMMITTEES.BESTUUR);
    const hideStickers = isIct || isBestuur;

    return (
        <Container>
            <Stack gap="xl">
                <Stack gap={4} align="center" ta="center">
                    <Title order={1} c="brand">
                        Beheer Dashboard
                    </Title>
                    <Text size="sm" c="dimmed">
                        Welkom terug, {access.user.first_name || 'Admin'}.
                    </Text>
                </Stack>

                {isLimitedAccess ? (
                    <Stack gap="xl" w="100%">
                        <DashboardHub permissions={permissions} stats={stats} />
                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                            <ActivitySignupsList data={activities} />
                            <Stack gap="lg">
                                <BirthdaysList data={birthdays} />
                                {!hideStickers && (
                                    <Box hiddenFrom="md">
                                        <TopStickersList data={stickers} />
                                    </Box>
                                )}
                            </Stack>
                        </SimpleGrid>
                    </Stack>
                ) : (
                    <Grid gap="xl" align="flex-start">
                        <GridCol span={{ base: 12, lg: 8, xl: 9 }}>
                            <Stack gap="xl">
                                <DashboardHub permissions={permissions} stats={stats} />
                                {!hideStickers && (
                                    <Box visibleFrom="md">
                                        <TopStickersList data={stickers} />
                                    </Box>
                                )}
                            </Stack>
                        </GridCol>

                        <GridCol span={{ base: 12, lg: 4, xl: 3 }}>
                            <Stack gap="xl">
                                <ActivitySignupsList data={activities} />
                                <BirthdaysList data={birthdays} />
                            </Stack>
                        </GridCol>
                    </Grid>
                )}
            </Stack>
        </Container>
    );
}
