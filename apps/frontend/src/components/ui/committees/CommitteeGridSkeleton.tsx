import React from 'react';
import { CommitteeCard } from '@/components/ui/committees/CommitteeCard';

/**
 * Proxy voor het commissie-overzicht in loading-state.
 * Gebruikt de ingebouwde skeleton van CommitteeCard om CLS te voorkomen.
 */
export const CommitteeGridSkeleton: React.FC = () => {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Bestuur Skeleton (wordt intern afgehandeld door de col-span logic in CommitteeCard) */}
            <CommitteeCard isLoading committee={{ name: 'Bestuur' } as any} />
            
            {/* Normale Skeletons */}
            {[...Array(6)].map((_, i) => (
                <CommitteeCard key={i} isLoading committee={{ name: 'Commissie' } as any} />
            ))}
        </div>
    );
};
