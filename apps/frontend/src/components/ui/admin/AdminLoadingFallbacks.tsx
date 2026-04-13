import React from 'react';

/**
 * DashboardLoading: High-fidelity masked fallback for the main dashboard.
 * Perfectly matches the geometry of the real dashboard to ensure Zero-Drift.
 */
export function DashboardLoading() {
    return (
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl skeleton-active" aria-busy="true">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-start">
                
                {/* Simulated Main Hub */}
                <div className="lg:col-span-8 space-y-12">
                    <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] h-[400px]" />
                    <div className="pt-12 border-t border-[var(--beheer-border)] opacity-30">
                        <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] h-[200px]" />
                    </div>
                </div>

                {/* Simulated Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] h-[300px]" />
                    <div className="bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)] h-[250px]" />
                </div>
            </div>
        </div>
    );
}

/**
 * AdminGenericLoading: Better fallback for other admin pages.
 */
export function AdminGenericLoading() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl skeleton-active" aria-busy="true">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="h-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)]" />
                <div className="h-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)]" />
                <div className="h-24 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)]" />
            </div>
            <div className="h-96 bg-[var(--beheer-card-bg)] border border-[var(--beheer-border)] rounded-[var(--beheer-radius)]" />
        </div>
    );
}
