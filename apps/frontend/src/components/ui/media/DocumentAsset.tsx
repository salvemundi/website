import { FileText, Download } from 'lucide-react';
import { Button } from '@mantine/core';

interface DocumentAssetProps {
    id: string;
    label?: string;
}

export default function DocumentAsset({ id, label = 'Download document' }: DocumentAssetProps) {
    return (
        <Button
            component="a"
            href={`/api/assets/${id}`}
            target="_blank"
            rel="noopener noreferrer"
            download
            variant="light"
            color="brand"
            size="sm"
            leftSection={<FileText size={16} />}
            rightSection={<Download size={14} />}
            style={{ flexShrink: 0 }}
        >
            {label}
        </Button>
    );
}
