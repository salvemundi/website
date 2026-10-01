import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function LoggingLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard 
            feature="logging" 
            title="Audit Logboek" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </BeheerGuard>
    );
}
