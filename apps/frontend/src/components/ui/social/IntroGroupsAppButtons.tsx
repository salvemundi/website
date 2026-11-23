import { MessageCircle, ExternalLink } from 'lucide-react';
import { Anchor, Box, Card, Group, Stack, Text } from '@mantine/core';
import type { WhatsAppGroup } from '@salvemundi/validations/schema/profiel.zod';

interface IntroGroupsAppButtonsProps {
    groups: WhatsAppGroup[];
}

export default function IntroGroupsAppButtons({ groups }: IntroGroupsAppButtonsProps) {
    if (groups.length === 0) {
        return (
            <Text size="sm" fw={500} c="dimmed">
                De groepsapp-uitnodiging volgt binnenkort.
            </Text>
        );
    }

    return (
        <Stack gap="sm">
            {groups.map((group) => (
                <Anchor
                    key={group.id}
                    href={group.invite_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="never"
                >
                    <Card bg="var(--mantine-color-brand-filled)" c="white" padding="md">
                        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
                            <Group align="flex-start" gap="sm" wrap="nowrap" miw={0}>
                                <Box mt={2} style={{ flexShrink: 0 }}>
                                    <MessageCircle size={20} />
                                </Box>
                                <Stack gap={4} miw={0}>
                                    <Text size="sm" fw={600} c="white">
                                        {group.name}
                                    </Text>
                                    {group.description && (
                                        <Text size="xs" c="white" opacity={0.85} style={{ whiteSpace: 'pre-wrap' }}>
                                            {group.description}
                                        </Text>
                                    )}
                                </Stack>
                            </Group>
                            <Box mt={2} style={{ flexShrink: 0, opacity: 0.8 }}>
                                <ExternalLink size={16} />
                            </Box>
                        </Group>
                    </Card>
                </Anchor>
            ))}
        </Stack>
    );
}
