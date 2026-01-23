/*
  Availability editing has been removed from the product. This component is intentionally
  replaced with a static notice so it won't contact Directus or attempt to read/update
  availability fields that no longer exist.
*/

'use client';

import React from 'react';

const SafeHavenAvailability: React.FC<{ userId: string }> = () => {
  return (
    <div className="rounded-2xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/30 p-6">
      <h3 className="text-lg font-bold mb-2">Bewerken van beschikbaarheid uitgeschakeld</h3>
      <p className="text-sm text-theme-muted">
        De mogelijkheid om beschikbaarheid in te stellen is verwijderd. Als je contactgegevens
        of beschikbaarheden wilt bijwerken, neem dan contact op met het bestuur.
      </p>
    </div>
  );
};

export default SafeHavenAvailability;
