import React from 'react';
import { type Activiteit } from '@salvemundi/validations/schema/activity.zod';
import { Calendar, Tag, ChevronRight } from 'lucide-react';
import Link from '@/components/ui/Link';
import { Anchor, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { formatDateRange } from '@/shared/lib/utils/date';

interface ActiviteitCardProps {
    activity?: Activiteit;
    title?: string;
    category?: string;
    date?: string;
    href?: string;
}

export const ActiviteitCard: React.FC<ActiviteitCardProps> = ({
    activity,
    title,
    category,
    date,
    href = '#'
}) => {
    const displayTitle = title || activity?.name;

    const rawCategory =
        category ||
        (activity as (Activiteit & { category?: string }) | undefined)?.category ||
        (activity as (Activiteit & { committee_name?: string }) | undefined)?.committee_name;
    const cleanCategory = (name?: string) => {
        if (!name || name === 'S.V. Salve Mundi') return 'S.V. Salve Mundi';
        return name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim() || name;
    };
    const displayCategory = cleanCategory(rawCategory);

    const displayDate = date || formatDateRange(activity?.event_date, activity?.event_date_end);

    return (
        <Anchor component={Link} href={href} underline="never" h="100%">
            <Card h="100%">
                <Stack justify="space-between" h="100%" gap="md">
                    <Stack gap="xs">
                        <Group gap="xs">
                            <Text span c="brand" lh={1}>
                                <Tag size={16} />
                            </Text>
                            <Text span size="xs" fw={700} c="brand">
                                {displayCategory}
                            </Text>
                        </Group>

                        <Text size="xl" fw={900} lineClamp={2}>
                            {displayTitle}
                        </Text>
                    </Stack>

                    <Group justify="space-between" pt="sm">
                        <Group gap="xs">
                            <Text span c="brand" lh={1}>
                                <Calendar size={16} />
                            </Text>
                            <Text span size="xs" fw={600} c="dimmed">
                                {displayDate}
                            </Text>
                        </Group>

                        <ThemeIcon size="sm" radius="xl" variant="light">
                            <ChevronRight size={14} />
                        </ThemeIcon>
                    </Group>
                </Stack>
            </Card>
        </Anchor>
    );
};
