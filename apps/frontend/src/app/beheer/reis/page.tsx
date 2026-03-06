import { Suspense } from 'react';
import type { Metadata } from 'next';

// V7 Specifics
import PageHeader from '@/components/ui/PageHeader';
import AdminReisTripsFetcher from '@/components/ui/beheer/AdminReisTripsFetcher';
import AdminReisDashboardSkeleton from '@/components/ui/beheer/AdminReisDashboardSkeleton';

export const metadata: Metadata = {
    title: 'Beheer Reis | SV Salve Mundi',
};

interface AdminReisPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReisPage({ searchParams }: AdminReisPageProps) {
    return (
        <div className="min-h-screen bg-[#f3f4f6]">
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
