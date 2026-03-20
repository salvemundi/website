import { Suspense } from 'react';
import type { Metadata } from 'next';

// V7 Specifics
import PageHeader from '@/components/ui/layout/PageHeader';
import AdminReisTripsFetcher from '@/components/ui/admin/AdminReisTripsFetcher';
import AdminReisDashboardSkeleton from '@/components/ui/admin/AdminReisDashboardSkeleton';

export const metadata: Metadata = {
    title: 'Beheer Reis | SV Salve Mundi',
};

interface AdminReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    return (
        <div className="min-h-screen bg-[var(--bg-main)]">
            {/* 1. Static Hoisting: PageHeader loaded outside of Suspense perfectly static */}
            <PageHeader
                title="Reis Aanmeldingen"
            />
            {/* Wrap the entire data-dependent UI in Suspense */}
            <Suspense fallback={
                <div className="container mx-auto px-4 py-8 max-w-6xl">
                    <AdminReisDashboardSkeleton />
                </div>
            }>
                <AdminReisTripsFetcher searchParams={searchParams} />
            </Suspense>
        </div>
    );
}
