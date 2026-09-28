interface Props {
    type?: string | null;
    custom?: string | null;
}

export default function CoboActivityBadge({ type = 'shotjes', custom }: Props) {
    switch (type) {
        case 'shotjes':
            return (
                <span className="inline-flex items-center rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                    <span>Shotjes</span>
                </span>
            );
        case 'watervallen':
            return (
                <span className="inline-flex items-center rounded-lg border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    <span>Watervallen</span>
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center rounded-lg border border-purple-500/20 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:text-purple-300" title={custom || undefined}>
                    <span>{custom || 'Anders'}</span>
                </span>
            );
    }
}
