import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function ImpersonateLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard 
            feature="impersonate" 
            title="Test Modus" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </BeheerGuard>
    );
}
