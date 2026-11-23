import { Badge } from '@mantine/core';

interface Props {
    type?: string | null;
    custom?: string | null;
}

export default function CoboActivityBadge({ type = 'shotjes', custom }: Props) {
    switch (type) {
        case 'shotjes':
            return (
                <Badge color="accent">
                    Shotjes
                </Badge>
            );
        case 'watervallen':
            return (
                <Badge>
                    Watervallen
                </Badge>
            );
        default:
            return (
                <Badge title={custom || undefined}>
                    {custom || 'Anders'}
                </Badge>
            );
    }
}
