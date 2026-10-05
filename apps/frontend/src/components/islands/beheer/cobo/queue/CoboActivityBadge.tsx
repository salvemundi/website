interface Props {
    type?: string | null;
    custom?: string | null;
}

export default function CoboActivityBadge({ type = 'shotjes', custom }: Props) {
    switch (type) {
        case 'shotjes':
            return (
                <span className="badge-cobo-shotjes">
                    <span>Shotjes</span>
                </span>
            );
        case 'watervallen':
            return (
                <span className="badge-cobo-watervallen">
                    <span>Watervallen</span>
                </span>
            );
        default:
            return (
                <span className="badge-cobo-custom" title={custom || undefined}>
                    <span>{custom || 'Anders'}</span>
                </span>
            );
    }
}
