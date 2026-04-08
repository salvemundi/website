import React from 'react';
import AdminReisSelectorIsland from '@/components/islands/admin/AdminReisSelectorIsland';
import AdminReisTableIsland from '@/components/islands/admin/AdminReisTableIsland';

export default function AdminReisDashboardSkeleton() {
    return (
        <div className="min-h-screen pb-20">
            <AdminReisSelectorIsland isLoading={true} />
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <AdminReisTableIsland isLoading={true} trip={{} as any} initialSignups={[]} initialSignupActivities={{}} />
            </div>
        </div>
    );
}
