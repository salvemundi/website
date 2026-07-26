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
            className={`form-button inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-(--bg-soft) text-(--theme-purple) text-sm font-bold hover:bg-(--theme-purple)/10 transition-colors ${className}`}
        >
            <FileText className="h-4 w-4" />
            {label}
            <Download className="h-3.5 w-3.5 opacity-60" />
        </a>
    );
}
