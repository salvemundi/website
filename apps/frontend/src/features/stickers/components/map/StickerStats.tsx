'use client';

import { useMemo } from 'react';
import { SimpleGrid } from '@mantine/core';
import { type StickerPublic } from '@salvemundi/validations';
import { normalizeCountryNameToDutch } from '../../utils/country-names';
import StatCard from './StatCard';

interface StickerStatsProps {
    stickers: StickerPublic[];
}

export default function StickerStats({ stickers }: StickerStatsProps) {
    const { totalStickers, countriesCount, citiesCount, topCountry } = useMemo(() => {
        const countryCounts = new Map<string, number>();
        const cities = new Set<string>();

        for (const sticker of stickers) {
            const dutchCountry = normalizeCountryNameToDutch(sticker.country);
            if (dutchCountry) {
                countryCounts.set(dutchCountry, (countryCounts.get(dutchCountry) ?? 0) + 1);
            }

            const city = sticker.city?.trim().toLowerCase();
            if (city) {
                cities.add(city);
            }
        }

        let leadingCountry = '-';
        let maxCount = 0;
        for (const [country, count] of countryCounts) {
            if (count > maxCount) {
                maxCount = count;
                leadingCountry = country;
            }
        }

        return {
            totalStickers: stickers.length,
            countriesCount: countryCounts.size,
            citiesCount: cities.size,
            topCountry: leadingCountry,
        };
    }, [stickers]);

    return (
        <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
            <StatCard label="Totaal" value={totalStickers} />
            <StatCard label="Landen" value={countriesCount} />
            <StatCard label="Steden" value={citiesCount} />
            <StatCard label="Top land" value={topCountry} />
        </SimpleGrid>
    );
}
