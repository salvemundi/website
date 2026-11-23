import { Drawer, Stack, Text, Title } from '@mantine/core';
import StickerFilters from './map/StickerFilters';
import StickerStats from './map/StickerStats';
import { type StickerPublic } from '@salvemundi/validations';

interface MobileOverlaysProps {
    showMobileFilters: boolean;
    showMobileStats: boolean;
    closeMobileOverlays: () => void;
    filterCountry: string;
    setFilterCountry: (country: string) => void;
    filterCity: string;
    setFilterCity: (city: string) => void;
    stickers: StickerPublic[];
}

export const MobileOverlays = ({
    showMobileFilters,
    showMobileStats,
    closeMobileOverlays,
    filterCountry,
    setFilterCountry,
    filterCity,
    setFilterCity,
    stickers,
}: MobileOverlaysProps) => {
    const isOpen = showMobileFilters || showMobileStats;

    return (
        <Drawer
            opened={isOpen}
            onClose={closeMobileOverlays}
            position="bottom"
            hiddenFrom="md"
            zIndex={210}
            size="auto"
            title={
                <Stack gap={2}>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.2em' }}>
                        Salve Mundi
                    </Text>
                    <Title order={4} tt="uppercase">
                        {showMobileFilters ? 'Filters' : 'Statistieken'}
                    </Title>
                </Stack>
            }
        >
            {showMobileFilters ? (
                <StickerFilters
                    filterCountry={filterCountry}
                    setFilterCountry={setFilterCountry}
                    filterCity={filterCity}
                    setFilterCity={setFilterCity}
                />
            ) : (
                <StickerStats stickers={stickers} />
            )}
        </Drawer>
    );
};
