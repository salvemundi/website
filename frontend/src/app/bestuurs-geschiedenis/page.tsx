"use client";

import Link from "next/link";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import { useSalvemundiBoard } from "@/shared/lib/hooks/useSalvemundiApi";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { ArrowLeft } from "lucide-react";
import Timeline from "@/components/timeline/Timeline";

export default function BoardHistoryPage() {
  const { data: boards = [], isLoading, error } = useSalvemundiBoard();

  function getMemberFullName(member: any) {
    // Try nested relation first (legacy naming)
    if (member?.member_id) {
      const m = member.member_id;
      const first = m.first_name || m.firstname || m.name || m.display_name;
      const last = m.last_name || m.lastname || m.surname || '';
      const combined = `${first || ''} ${last || ''}`.trim();
      if (combined) return combined;
    }

    // Direct user relation preferred (current payload uses `user_id`)
    if (member?.user_id) {
      const u = member.user_id;
      const first = u.first_name || u.firstname || u.name || u.display_name || u.given_name;
      const last = u.last_name || u.lastname || u.surname || u.family_name || '';
      const combined = `${first || ''} ${last || ''}`.trim();
      if (combined) return combined;
    }

    // Try direct fields on the member object
    const firstDirect = member.first_name || member.firstname || member.given_name;
    const lastDirect = member.last_name || member.lastname || member.family_name;
    if (firstDirect || lastDirect) return `${firstDirect || ''} ${lastDirect || ''}`.trim();

    // Try alternative names
    if (member.name) return member.name;
    if (member.full_name) return member.full_name;

    return 'Onbekend';
  }

  return (
    <>
      <div className="relative z-10">
        <PageHeader title="BESTUURSGESCHIEDENIS">
          <p className="text-lg sm:text-xl text-white/90 max-w-3xl mx-auto mt-4">
            Ontdek alle eerdere besturen van Salve Mundi
          </p>
        </PageHeader>

        <main className="mx-auto max-w-app px-4 py-12 sm:px-6 lg:px-8">
          <Link
            href="/commissies/bestuur"
            className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-paars transition hover:text-paars/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Terug naar huidig bestuur
          </Link>

          {isLoading ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-3xl bg-white/60"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-[var(--bg-card)] p-8 text-center shadow-lg">
              <p className="mb-2 text-lg font-semibold text-paars">
                Fout bij laden van bestuursgeschiedenis
              </p>
              <p className="text-sm text-slate-600">{String(error)}</p>
            </div>
          ) : boards.length === 0 ? (
            <div className="rounded-3xl bg-[var(--bg-card)] p-8 text-center shadow-lg">
              <p className="text-lg text-slate-600">
                Geen bestuursgeschiedenis gevonden
              </p>
            </div>
          ) : (
            <Timeline
              boards={boards}
              getImageUrl={getImageUrl}
              getMemberFullName={getMemberFullName}
            />
          )}
        </main>
      </div>
    </>
  );
}

