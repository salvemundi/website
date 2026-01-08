'use client';

import React from 'react';
import PageHeader from '@/widgets/page-header/ui/PageHeader';
import SafeHavenWeeklyAvailability from '@/components/safe-haven-availability/SafeHavenWeeklyAvailability';
import { useAuth } from '@/features/auth/providers/auth-provider';

export default function SafeHavenAvailabilityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading || !user) return <div className="min-h-screen flex items-center justify-center">Laden...</div>;
  if (!isAuthenticated || !user.is_safe_haven) return <div className="min-h-screen flex items-center justify-center">Niet toegestaan</div>;

  return (
    <div className="min-h-screen">
      <PageHeader title="Safe Haven Beschikbaarheid" />
      <div className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
        <SafeHavenWeeklyAvailability userId={user.id} />
      </div>
    </div>
  );
}
