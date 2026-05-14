'use client';

import dynamic from 'next/dynamic';

const PwaInstallToast = dynamic(
    () => import('@/components/ui/layout/PwaInstallToast').then(mod => mod.PwaInstallToast),
    { ssr: false }
);

export function PwaInstallIsland() {
    return <PwaInstallToast />;
}
