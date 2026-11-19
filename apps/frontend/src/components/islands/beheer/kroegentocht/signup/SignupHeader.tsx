'use client';

import { User } from 'lucide-react';
import { Box, Divider, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';

export default function SignupHeader() {
    return (
        <>
            <Box p="xl">
                <Group gap="sm">
                    <ThemeIcon size="lg" variant="light" color="brand" radius="md">
                        <User size={20} />
                    </ThemeIcon>
                    <Stack gap={2}>
                        <Title order={2} size="h3">
                            Aanmelding{' '}
                            <Text span c="brand" inherit>
                                Details
                            </Text>
                        </Title>
                        <Text size="xs" c="dimmed">
                            Beheer gegevens en tickets van de deelnemer
                        </Text>
                    </Stack>
                </Group>
            </Box>
            <Divider />
        </>
    );
}
