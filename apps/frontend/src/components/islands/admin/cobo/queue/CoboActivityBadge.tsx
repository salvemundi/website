interface Props {
    type?: string | null;
    custom?: string | null;
}

export default function CoboActivityBadge({ type = 'shotjes', custom }: Props) {
    switch (type) {
        case 'shotjes':
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                    <span>Shotjes</span>
                </span>
            );
        case 'watervallen':
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                    <span>Watervallen</span>
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20" title={custom || undefined}>
                    <span>{custom || 'Anders'}</span>
                </span>
            );
    }
}
