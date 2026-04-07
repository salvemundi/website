import React from 'react';
import { TransactionsIsland } from '@/components/islands/account/TransactionsIsland';

/**
 * Proxy voor TransactionsIsland in loading-state.
 * Gebruikt de ingebouwde skeleton van de echte component om CLS te voorkomen.
 */
export const TransactionsSkeleton: React.FC = () => {
    return <TransactionsIsland isLoading />;
};
