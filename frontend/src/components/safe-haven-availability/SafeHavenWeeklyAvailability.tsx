"use client";

import React from 'react';

const SafeHavenWeeklyAvailability: React.FC<{ userId: string }> = () => {
  return (
    <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/30 p-6">
      <h3 className="text-lg font-bold mb-2">Wekelijkse beschikbaarheid uitgeschakeld</h3>
      <p className="text-sm text-theme-muted">
        Het beheren van wekelijkse beschikbaarheid is uitgeschakeld. Beschikbaarheid wordt niet
        langer opgeslagen in het systeem.
      </p>
    </div>
  );
};

export default SafeHavenWeeklyAvailability;
