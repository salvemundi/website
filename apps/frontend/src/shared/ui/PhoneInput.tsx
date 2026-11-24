'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Button, Group, Popover, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import {
    type Country,
    ALL_COUNTRIES,
    getCountryName,
    matchesCountrySearch,
    parsePhoneNumber
} from '@/shared/lib/countries';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    error?: boolean;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(({
    error,
    id,
    disabled = false,
    ...props
}, ref) => {
    const rawValue = typeof props.value === 'string' ? props.value : (props.value ? String(props.value) : '');

    const parsed = useMemo(() => parsePhoneNumber(rawValue), [rawValue]);
    const [selectedCountry, setSelectedCountry] = useState<Country>(parsed.country);
    const [nationalNumber, setNationalNumber] = useState<string>(parsed.nationalNumber);
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (rawValue) {
            const currentParsed = parsePhoneNumber(rawValue);
            setSelectedCountry(currentParsed.country);
            setNationalNumber(currentParsed.nationalNumber);
        } else if (rawValue === '') {
            setNationalNumber('');
        }
    }, [rawValue]);

    const emitChange = (country: Country, number: string) => {
        const cleanedNumber = number.trim();
        const fullValue = cleanedNumber ? `${country.dialCode} ${cleanedNumber}` : '';
        props.onChange?.({
            target: {
                value: fullValue,
                name: props.name ?? ''
            }
        } as unknown as React.ChangeEvent<HTMLInputElement>);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Alleen tekens toestaan die de validatie accepteert (voorkomt fouten bij plakken van bijv. "06.12.34.56.78")
        const inputVal = e.target.value.replace(/[^\d\s\-()+]/g, '');

        if (inputVal.startsWith('+') || inputVal.startsWith('00')) {
            const parsedPasted = parsePhoneNumber(inputVal);
            setSelectedCountry(parsedPasted.country);
            setNationalNumber(parsedPasted.nationalNumber);
            emitChange(parsedPasted.country, parsedPasted.nationalNumber);
            return;
        }

        let cleaned = inputVal;
        if (cleaned.startsWith('0') && cleaned.length > 1) {
            cleaned = cleaned.slice(1);
        }

        setNationalNumber(cleaned);
        emitChange(selectedCountry, cleaned);
    };

    const handleSelectCountry = (country: Country) => {
        setSelectedCountry(country);
        setIsOpen(false);
        setSearchQuery('');
        emitChange(country, nationalNumber);
    };

    const filteredCountries = useMemo(() => {
        if (!searchQuery.trim()) return ALL_COUNTRIES;
        const query = searchQuery.toLowerCase().trim();
        return ALL_COUNTRIES.filter((c) => matchesCountrySearch(c.code, query) || c.dialCode.includes(query));
    }, [searchQuery]);

    const countryDisplayName = getCountryName(selectedCountry.code, 'nl');

    return (
        <Group gap="xs" wrap="nowrap" align="flex-start">
            <Popover
                opened={isOpen}
                onChange={(opened) => {
                    setIsOpen(opened);
                    if (!opened) setSearchQuery('');
                }}
                position="bottom-start"
                width={300}
                shadow="md"
            >
                <Popover.Target>
                    <Button
                        type="button"
                        variant="default"
                        disabled={disabled}
                        onClick={() => setIsOpen((prev) => !prev)}
                        aria-label={`Selecteer land, huidig: ${countryDisplayName} (${selectedCountry.dialCode})`}
                        aria-expanded={isOpen}
                        rightSection={<ChevronDown size={14} />}
                    >
                        {selectedCountry.code} {selectedCountry.dialCode}
                    </Button>
                </Popover.Target>
                <Popover.Dropdown p="xs">
                    <Stack gap="xs">
                        <TextInput
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Zoek land of code..."
                            leftSection={<Search size={14} />}
                            size="sm"
                        />
                        <ScrollArea.Autosize mah={240}>
                            <Stack gap={2}>
                                {filteredCountries.length > 0 ? (
                                    filteredCountries.map((c) => {
                                        const isSelected = c.code === selectedCountry.code;
                                        const countryName = getCountryName(c.code, 'nl');
                                        return (
                                            <Button
                                                key={c.code}
                                                type="button"
                                                variant={isSelected ? 'light' : 'subtle'}
                                                size="xs"
                                                justify="space-between"
                                                fullWidth
                                                onClick={() => handleSelectCountry(c)}
                                                rightSection={isSelected ? <Check size={14} /> : undefined}
                                            >
                                                {c.code} · {countryName} ({c.dialCode})
                                            </Button>
                                        );
                                    })
                                ) : (
                                    <Text size="xs" c="dimmed" ta="center" py="md">
                                        Geen landen gevonden voor &quot;{searchQuery}&quot;
                                    </Text>
                                )}
                            </Stack>
                        </ScrollArea.Autosize>
                    </Stack>
                </Popover.Dropdown>
            </Popover>

            <TextInput
                ref={ref}
                id={id}
                name={props.name}
                type="tel"
                inputMode="tel"
                autoComplete={props.autoComplete ?? 'tel-national'}
                disabled={disabled}
                required={props.required}
                placeholder={props.placeholder ?? selectedCountry.placeholder}
                value={nationalNumber}
                onChange={handleNumberChange}
                onBlur={props.onBlur}
                error={error}
                style={{ flex: 1 }}
            />
        </Group>
    );
});

PhoneInput.displayName = 'PhoneInput';
