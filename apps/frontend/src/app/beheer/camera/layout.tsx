import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function CameraBeheerLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="camera"
            title="Camera Beheer"
            description="Je hebt geen rechten om de camera-uitleen te beheren."
        >
            {children}
        </BeheerGuard>
    );
}
