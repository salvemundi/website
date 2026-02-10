'use client';

import PageHeader from '@/widgets/page-header/ui/PageHeader';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * SafeHavenAvailabilityPage - Protected feature (currently disabled)
 * Auth handled by ProtectedRoute wrapper
 */
export default function SafeHavenAvailabilityPage() {
  return (
    <ProtectedRoute requireAuth>
      <SafeHavenContent />
    </ProtectedRoute>
  );
}

function SafeHavenContent() {
  return (
    <div className="min-h-screen">
      <PageHeader title="Safe Haven Beschikbaarheid" />
      <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/20 border border-slate-200 dark:border-slate-700/30 p-8 text-center">
          <h2 className="text-xl font-bold text-theme">Bewerken van beschikbaarheid uitgeschakeld</h2>
          <p className="mt-3 text-theme-muted">
            Het bijwerken van Safe Haven beschikbaarheid is momenteel uitgeschakeld. Neem contact op met het bestuur
            als je deze functionaliteit nodig hebt.
          </p>
        </div>
      </div>
    </div>
  );
}
