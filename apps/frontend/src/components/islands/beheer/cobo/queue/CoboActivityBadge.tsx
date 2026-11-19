import { Badge } from '@mantine/core';

interface Props {
    type?: string | null;
    custom?: string | null;
}

export default function CoboActivityBadge({ type = 'shotjes', custom }: Props) {
    switch (type) {
        case 'shotjes':
            return (
                <Badge color="accent" variant="light" radius="md">
                    Shotjes
                </Badge>
            );
        case 'watervallen':
            return (
                <Badge color="brand" variant="light" radius="md">
                    Watervallen
                </Badge>
            );
        default:
            return (
                <Badge color="brand" variant="outline" radius="md" title={custom || undefined}>
                    {custom || 'Anders'}
                </Badge>
            );
    }
}
