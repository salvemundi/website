import React from 'react';
import SafeHavenCard from './SafeHavenCard';

/**
 * Proxy voor SafeHavenCard in loading-state.
 * Gebruikt de ingebouwde skeleton van de echte component om CLS te voorkomen.
 */
export default function SafeHavenSkeleton() {
    return <SafeHavenCard isLoading />;
}

