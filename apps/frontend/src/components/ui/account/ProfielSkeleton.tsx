import { Gamepad2, Mail, Calendar } from 'lucide-react';

import React from 'react';
import { ProfielIsland } from '@/components/islands/account/ProfielIsland';

/**
 * Proxy voor ProfielIsland in loading-state.
 * Gebruikt de ingebouwde skeleton van de echte component om CLS te voorkomen.
 */
export const ProfielSkeleton: React.FC = () => {
    return <ProfielIsland isLoading />;
};
