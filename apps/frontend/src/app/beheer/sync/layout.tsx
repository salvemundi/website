import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function SyncLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard 
            feature="sync" 
            title="Azure Sync" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </BeheerGuard>
    );
}
