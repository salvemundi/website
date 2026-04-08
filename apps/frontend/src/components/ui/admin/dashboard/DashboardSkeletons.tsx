import React from 'react';
import { ActionCard, ListCard } from './AdminCards';
import { DashboardHub, BirthdaysList, TopStickersList, ActivitySignupsList } from './DashboardSections';

/**
 * Universal Button Skeleton Proxy.
 */
export function ActionCardSkeleton() {
    return <ActionCard isLoading={true} />;
}

/**
 * Deprecated StatCardSkeleton Proxy.
 */
export function StatCardSkeleton() {
    return <ActionCard isLoading={true} />;
}

/**
 * Main Dashboard Skeleton Proxy.
 */
export function HubSkeleton({ isLimitedAccess = false }: { isLimitedAccess?: boolean }) {
    return <DashboardHub isLoading={true} />;
}

/**
 * List Card Skeleton Proxy.
 */
export function ListCardSkeleton({ rows = 3 }: { rows?: number }) {
    return <ListCard isLoading={true} children={null} />;
}

/**
 * Activity Signups Skeleton Proxy.
 */
export function ActivitySignupsSkeleton() {
    return <ActivitySignupsList isLoading={true} />;
}
