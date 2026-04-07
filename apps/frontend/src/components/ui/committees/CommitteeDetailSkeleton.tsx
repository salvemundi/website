import React from 'react';
import { CommitteeDetail } from './CommitteeDetail';

/**
 * Proxy voor de commissie-detailpagina in loading-state.
 * Gebruikt de ingebouwde skeleton van CommitteeDetail om CLS te voorkomen.
 */
export const CommitteeDetailSkeleton: React.FC = () => {
    return <CommitteeDetail isLoading />;
};
