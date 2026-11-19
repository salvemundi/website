'use client';

import { useState, useEffect } from 'react';
import { Search, Check, User, X } from 'lucide-react';
import {
    ActionIcon,
    Avatar,
    Box,
    Center,
    Group,
    Loader,
    Popover,
    ScrollArea,
    Stack,
    Text,
    TextInput,
    ThemeIcon,
    UnstyledButton,
} from '@mantine/core';
import { useDebounce } from '@/hooks/use-debounce';
import { searchMembersAction } from '@/server/actions/beheer/activiteiten/beheer-activiteiten-signups.actions';
import { type UserBasic } from '@salvemundi/validations';
import { safeConsoleError } from '@/server/utils/logger';

interface AdminLedenSearchProps {
    onSelect: (user: UserBasic) => void;
    placeholder?: string;
    autoFocus?: boolean;
    disabled?: boolean;
}

export default function BeheerLedenSearch({
    onSelect,
    placeholder = 'Zoek lid op naam of email...',
    autoFocus = false,
    disabled = false
}: AdminLedenSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserBasic[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        if (debouncedQuery.length < 2) {
            setResults([]);
            setIsOpen(false);
            return;
        }

        const fetchResults = async () => {
            setIsLoading(true);
            try {
                const res = await searchMembersAction(debouncedQuery);
                if (res.success) {
                    setResults(res.data);
                    setIsOpen(true);
                } else {
                    setResults([]);
                }
            } catch (error) {
                safeConsoleError('[UserSearch.tsx][UserSearch] Fout bij het ophalen van zoekresultaten', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchResults();
    }, [debouncedQuery]);

    const handleSelect = (user: UserBasic) => {
        onSelect(user);
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    const handleClear = () => {
        setQuery('');
        setResults([]);
        setIsOpen(false);
    };

    return (
        <Box w="100%">
            <Popover
                opened={isOpen && query.length >= 2}
                onChange={setIsOpen}
                width="target"
                position="bottom-start"
                shadow="lg"
                radius="lg"
                closeOnClickOutside
            >
                <Popover.Target>
                    <TextInput
                        type="text"
                        inputMode="search"
                        value={query}
                        onChange={(e) => setQuery(e.currentTarget.value)}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        placeholder={placeholder}
                        disabled={disabled}
                        autoFocus={autoFocus}
                        autoComplete="off"
                        leftSection={<Search size={16} />}
                        rightSection={
                            isLoading ? (
                                <Loader size="xs" />
                            ) : query ? (
                                <ActionIcon
                                    type="button"
                                    variant="subtle"
                                    size="sm"
                                    onClick={handleClear}
                                    aria-label="Zoekopdracht wissen"
                                >
                                    <X size={14} />
                                </ActionIcon>
                            ) : null
                        }
                    />
                </Popover.Target>

                <Popover.Dropdown p="xs">
                    {results.length > 0 ? (
                        <ScrollArea.Autosize mah={288}>
                            <Stack gap={4}>
                                <Text size="xs" fw={700} c="dimmed" px="xs" py={4}>
                                    Resultaten
                                </Text>
                                {results.map((user) => (
                                    <UnstyledButton
                                        key={user.id}
                                        type="button"
                                        onClick={() => handleSelect(user)}
                                        w="100%"
                                        p="sm"
                                        style={{ borderRadius: 'var(--mantine-radius-md)' }}
                                    >
                                        <Group justify="space-between" wrap="nowrap" gap="sm">
                                            <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                                                <Avatar radius="md" color="brand" variant="light">
                                                    {user.first_name?.[0]}{user.last_name?.[0]}
                                                </Avatar>
                                                <Stack gap={0} style={{ minWidth: 0, flex: 1 }}>
                                                    <Text size="sm" fw={600} truncate="end">
                                                        {user.first_name} {user.last_name}
                                                    </Text>
                                                    <Text size="xs" c="dimmed" truncate="end">
                                                        {user.email}
                                                    </Text>
                                                </Stack>
                                            </Group>
                                            <ThemeIcon size="sm" radius="xl" variant="light" color="brand">
                                                <Check size={14} />
                                            </ThemeIcon>
                                        </Group>
                                    </UnstyledButton>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    ) : (
                        !isLoading && (
                            <Center py="xl">
                                <Stack align="center" gap="xs">
                                    <ThemeIcon size="lg" radius="md" variant="default">
                                        <User size={18} />
                                    </ThemeIcon>
                                    <Text size="xs" fw={600} c="dimmed" fs="italic">
                                        Geen lid gevonden met deze naam...
                                    </Text>
                                </Stack>
                            </Center>
                        )
                    )}
                </Popover.Dropdown>
            </Popover>
        </Box>
    );
}
