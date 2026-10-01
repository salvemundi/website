import BeheerGuard from '@/components/ui/beheer/BeheerGuard';
import type { ReactNode } from 'react';

export default function WebshopAfhalenLayout({ children }: { children: ReactNode }) {
    return (
        <BeheerGuard
            feature="webshop_pickup"
            title="Afhaallijst"
            description="Alleen het bestuur kan de afhaallijst inzien."
        >
            {children}
        </BeheerGuard>
    );
}
