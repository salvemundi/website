import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function ServicesLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard 
            feature="services" 
            title="Systeem Status" 
            description="Deze systeemfunctie is exclusief gereserveerd voor de ICT-commissie."
        >
            {children}
        </BeheerGuard>
    );
}
