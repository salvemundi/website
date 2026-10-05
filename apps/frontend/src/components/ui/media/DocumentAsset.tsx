import { FileText, Download } from 'lucide-react';

interface DocumentAssetProps {
    id: string;
    label?: string;
    className?: string;
}

export default function DocumentAsset({ id, label = 'Download document', className = '' }: DocumentAssetProps) {
    return (
        <a
            href={`/api/assets/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={`btn-secondary inline-flex items-center gap-2 ${className}`}
        >
            <FileText className="size-4" />
            {label}
            <Download className="size-3.5 opacity-60" />
        </a>
    );
}
