'use client';

import { ChevronDown } from 'lucide-react';
import { Button, Menu, ScrollArea, Text } from '@mantine/core';

interface GroupSelectDropdownProps {
    value: string;
    options: string[];
    onChange: (newValue: string | null) => void;
    placeholder?: string;
    size?: 'sm' | 'xs';
}

export default function GroupSelectDropdown({
    value,
    options,
    onChange,
    placeholder = 'Niet ingedeeld',
    size = 'sm',
}: GroupSelectDropdownProps) {
    const selectedLabel = value || placeholder;

    return (
        <Menu shadow="md" width={192} position="bottom-end">
            <Menu.Target>
                <Button
                    type="button"
                    size={size === 'xs' ? 'compact-xs' : 'xs'}
                    rightSection={<ChevronDown size={12} />}
                >
                    <Text size="xs" fw={600} truncate maw={120}>
                        {selectedLabel}
                    </Text>
                </Button>
            </Menu.Target>

            <Menu.Dropdown p={4}>
                <ScrollArea.Autosize mah={320}>
                    <Menu.Item
                        onClick={() => onChange(null)}
                        bg={!value ? 'var(--mantine-color-brand-light)' : undefined}
                        c={!value ? 'brand' : undefined}
                        fw={!value ? 700 : 500}
                    >
                        {placeholder}
                    </Menu.Item>
                    {options.map((option) => {
                        const isSelected = value === option;
                        return (
                            <Menu.Item
                                key={option}
                                onClick={() => onChange(option)}
                                bg={isSelected ? 'var(--mantine-color-brand-light)' : undefined}
                                c={isSelected ? 'brand' : undefined}
                                fw={isSelected ? 700 : 500}
                            >
                                {option}
                            </Menu.Item>
                        );
                    })}
                </ScrollArea.Autosize>
            </Menu.Dropdown>
        </Menu>
    );
}
