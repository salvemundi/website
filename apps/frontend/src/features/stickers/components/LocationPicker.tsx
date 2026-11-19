import { LocateFixed } from 'lucide-react';
import { Box, Button, Group, Paper, Stack, Text, TextInput } from '@mantine/core';
import { type LocationSearchResult } from '@/shared/lib/utils/geolocation';

interface LocationPickerProps {
    selectedLocation: { lat: number; lng: number } | null;
    formData: { city: string; country: string; location_name: string };
    onReset: () => void;
    onUseCurrentLocation: () => void;
    isLocatingCurrent: boolean;
    addressQuery: string;
    onAddressQueryChange: (query: string) => void;
    onAddressSearch: () => void;
    isSearching: boolean;
    searchResults: LocationSearchResult[];
    onSelectResult: (result: LocationSearchResult) => void;
    locationError: string | null;
}

export const LocationPicker = ({
    selectedLocation,
    formData,
    onReset,
    onUseCurrentLocation,
    isLocatingCurrent,
    addressQuery,
    onAddressQueryChange,
    onAddressSearch,
    isSearching,
    searchResults,
    onSelectResult,
    locationError,
}: LocationPickerProps) => {
    return (
        <Stack gap="xs">
            <Text size="xs" fw={900} tt="uppercase" c="dimmed" style={{ letterSpacing: '0.08em' }}>
                Locatie
            </Text>

            <Group justify="space-between" gap="sm" wrap="nowrap">
                <Text size="sm" flex={1}>
                    {selectedLocation ? (
                        <>
                            {formData.city && formData.country ? `${formData.city}, ${formData.country}` : 'Locatie geselecteerd'}
                            {' '}({selectedLocation.lat.toFixed(5)}, {selectedLocation.lng.toFixed(5)})
                        </>
                    ) : (
                        'Geen locatie geselecteerd'
                    )}
                </Text>
                <Button
                    type="button"
                    variant="default"
                    size="xs"
                    onClick={onReset}
                >
                    Reset
                </Button>
            </Group>

            <Button
                type="button"
                variant="default"
                fullWidth
                onClick={onUseCurrentLocation}
                loading={isLocatingCurrent}
                leftSection={<LocateFixed size={16} />}
            >
                Gebruik mijn huidige locatie
            </Button>

            <Box pos="relative">
                <Group gap="xs">
                    <TextInput
                        value={addressQuery}
                        onChange={(e) => onAddressQueryChange(e.currentTarget.value)}
                        placeholder="Zoek adres of plaats"
                        style={{ flex: 1 }}
                    />
                    <Button
                        type="button"
                        variant="default"
                        size="sm"
                        hiddenFrom="sm"
                        onClick={onAddressSearch}
                        loading={isSearching}
                    >
                        Zoek
                    </Button>
                </Group>

                {searchResults.length > 0 && (
                    <Paper
                        shadow="xl"
                        radius="md"
                        pos="absolute"
                        left={0}
                        right={0}
                        top="100%"
                        mt={4}
                        bg="var(--mantine-color-default)"
                        style={{
                            zIndex: 20,
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <Stack gap={0}>
                            {searchResults.map((result, idx) => (
                                <Button
                                    key={`${result.lat}-${result.lng}-${idx}`}
                                    type="button"
                                    variant="subtle"
                                    size="xs"
                                    fullWidth
                                    justify="flex-start"
                                    onClick={() => onSelectResult(result)}
                                >
                                    {result.displayName}
                                </Button>
                            ))}
                        </Stack>
                    </Paper>
                )}
            </Box>

            {locationError && (
                <Text size="xs" fw={700} c="error">
                    {locationError}
                </Text>
            )}
        </Stack>
    );
};
