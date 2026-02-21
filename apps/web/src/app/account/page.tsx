import { getCurrentUserAction } from "@/shared/api/auth-actions";
import { getUserCommitteesAction } from "@/shared/api/data-actions";
import { getUserEventSignupsAction } from "@/shared/api/account-actions";
import { redirect } from "next/navigation";
import { Mail, Gamepad2, Calendar, ChevronRight } from "lucide-react";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import NotificationToggle from "@/components/NotificationToggle";
import ProfileCard from "./components/ProfileCard";
import QuickLinksSection from "./components/QuickLinksSection";
import EventSignupsSection from "./components/EventSignupsSection";
import LogoutButton from "./components/LogoutButton";
import ProfileFormsWrapper from "./components/ProfileFormsWrapper";

function Tile({
  title,
  icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg transition-all hover:shadow-xl",
        className,
      ].join(" ")}
    >
      <div className="relative p-6 sm:p-8">
        {title && (
          <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {icon ? (
                <div className="shrink-0 rounded-2xl bg-theme-purple/10 dark:bg-white/10 p-2.5 text-theme-purple dark:text-white">
                  {icon}
                </div>
              ) : null}
              <h2 className="min-w-0 break-words whitespace-normal text-2xl font-bold text-theme-purple dark:text-white">
                {title}
              </h2>
            </div>
          </header>
        )}
        <div className="text-theme-text dark:text-white/80">{children}</div>
      </div>
    </section>
  );
}

/**
 * AccountPage — Server Component (Data Hub)
 *
 * Fetches all user data on the server and passes it as plain props to
 * small Client Islands below. No "use client" here — this is the "Ocean".
 */
export default async function AccountPage() {
  // Auth check: get the current user first (needed to derive IDs for other queries)
  const user = await getCurrentUserAction();

  if (!user) {
    redirect("/");
  }

  // Fetch committees and event signups in parallel now that we have the user ID
  const [rawCommittees, eventSignups] = await Promise.all([
    getUserCommitteesAction(user.id),
    getUserEventSignupsAction(),
  ]);

  // Map raw committee rows to the typed shape expected by User and components
  const committees = rawCommittees
    .map((row: any) => {
      const c = row?.committee_id;
      if (!c?.id || c.is_visible === false) return null;
      return {
        id: String(c.id),
        name: String(c.name || ""),
        is_leader: !!row.is_leader,
      };
    })
    .filter(Boolean) as Array<{ id: string; name: string; is_leader: boolean }>;

  // Enrich the user snapshot with fresh server-fetched committee data
  const enrichedUser = { ...user, committees };
  const isCommitteeMember = committees.length > 0;

  return (
    <div className="min-h-screen bg-[var(--bg-main)]">
      <PageHeader
        title="Mijn Account"
        variant="centered"
        titleClassName="text-theme-purple dark:text-white text-3xl sm:text-4xl md:text-5xl"
        imageFilter="brightness(0.65) blur(4px)"
        description={
          <p className="text-lg sm:text-xl text-theme-purple dark:text-white max-w-3xl mt-4 font-medium mx-auto">
            Beheer je gegevens, lidmaatschap en inschrijvingen.
          </p>
        }
      >
        {/* 🏝 Island: logout button (needs useAuth) */}
        <div className="mt-8 flex justify-center">
          <LogoutButton />
        </div>
      </PageHeader>

      <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">

          {/* ── Left column ─────────────────────────────────── */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
            {/* 🏝 Island: Profile card (avatar upload + member info) */}
            <Tile className="h-fit">
              <ProfileCard initialUser={enrichedUser} />
            </Tile>

            {/* 🏝 Island: Minecraft gaming form */}
            <Tile title="Social Gaming" icon={<Gamepad2 className="h-5 w-5" />} className="h-fit">
              <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <ProfileFormsWrapper user={enrichedUser} variant="gaming" />
              </div>
            </Tile>
          </div>

          {/* ── Right column ─────────────────────────────────── */}
          <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
            <Tile title="Mijn gegevens" icon={<Mail className="h-5 w-5" />} className="h-fit">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Static: primary email (no interactivity needed) */}
                <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <div className="shrink-0 rounded-xl bg-theme-purple/10 dark:bg-white/10 p-3 text-theme-purple dark:text-white shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-theme-purple/60 dark:text-white/40 font-bold uppercase tracking-wide mb-1">
                      E-mailadres
                    </p>
                    <p className="font-bold text-theme-purple dark:text-white truncate text-sm" title={enrichedUser.email}>
                      {enrichedUser.email}
                    </p>
                  </div>
                </div>

                {/* Static: Fontys email (conditional) */}
                {enrichedUser.fontys_email ? (
                  <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                    <div className="shrink-0 rounded-xl bg-theme-purple/10 dark:bg-white/10 p-3 text-theme-purple dark:text-white shadow-sm">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] text-theme-purple/60 dark:text-white/40 font-bold uppercase tracking-wide mb-1">
                        Fontys e-mail
                      </p>
                      <p className="font-bold text-theme-purple dark:text-white truncate text-sm" title={enrichedUser.fontys_email}>
                        {enrichedUser.fontys_email}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* 🏝 Island: Phone number form */}
                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                  <ProfileFormsWrapper user={enrichedUser} variant="phone" />
                </div>
              </div>

              {/* 🏝 Island: Date of birth form (full width below grid) */}
              <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <ProfileFormsWrapper user={enrichedUser} variant="dob" />
              </div>

              {/* 🏝 Island: Push notifications (browser API = client) */}
              <div className="mt-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <p className="text-[11px] font-bold uppercase text-theme-purple/70 dark:text-white/50 tracking-wide text-left">
                    Push Notificaties
                  </p>
                </div>
                <p className="text-sm text-theme-purple/70 dark:text-white/60 mb-4">
                  Ontvang push notificaties for nieuwe activiteiten en belangrijke updates.
                </p>
                <NotificationToggle userId={enrichedUser.id} className="w-full justify-center" />
              </div>
            </Tile>

            {/* 🌊 Server Component: Quick links (static anchor tags, no hooks) */}
            <Tile title="Snelle links" icon={<ChevronRight className="h-5 w-5" />} className="h-fit">
              <QuickLinksSection
                membershipStatus={enrichedUser.membership_status ?? "none"}
                isCommitteeMember={isCommitteeMember}
              />
            </Tile>
          </div>

          {/* ── Full-width row: event signups ─────────────────── */}
          <div className="md:col-span-12">
            {/* 🏝 Island: Event signups (past/upcoming toggle is client-side) */}
            <Tile title="Mijn inschrijvingen" icon={<Calendar className="h-5 w-5" />} className="h-fit">
              <EventSignupsSection initialSignups={eventSignups} />
            </Tile>
          </div>
        </div>
      </main>
    </div>
  );
}
