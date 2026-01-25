"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getUserEventSignups, updateMinecraftUsername } from "@/shared/lib/auth";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { format, startOfDay, isBefore } from "date-fns";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import { stripHtml } from "@/shared/lib/text";
import {
  LogOut,
  CreditCard,
  MessageCircle,
  FileText,
  Mail,
  Phone,
  Gamepad2,
  Calendar,
  Shield,
  ExternalLink,
  ChevronRight,
  Lock,
} from "lucide-react";

interface EventSignup {
  id: number;
  created_at: string;
  event_id: {
    id: number;
    name: string;
    event_date: string;
    description: string;
    image?: string;
    contact_phone?: string;
    contact_name?: string;
  };
}

function Tile({
  title,
  icon,
  children,
  className = "",
  actions,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl bg-white/95 dark:bg-surface-dark/95 shadow-lg",
        className,
      ].join(" ")}
    >
      <div className="relative p-6 sm:p-7">
        {(title || actions) && (
          <header className="mb-5 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              {icon ? (
                <div className="shrink-0 rounded-xl bg-theme-purple/10 p-2 text-theme-purple dark:text-theme-white">
                  {icon}
                </div>
              ) : null}
              {title ? (
                <h2 className="truncate text-lg font-bold text-theme-purple dark:text-theme-white">
                  {title}
                </h2>
              ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </header>
        )}

        <div className="text-theme-text/80 dark:text-theme-white/80">
          {children}
        </div>
      </div>
    </section>
  );
}

function QuickLink({
  label,
  icon,
  onClick,
  href,
  locked,
  external,
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  href?: string;
  locked?: boolean;
  external?: boolean;
}) {
  const common =
    "group flex flex-col items-center justify-center gap-2 rounded-2xl bg-theme-purple/5 dark:bg-white/5 p-4 text-center transition hover:bg-theme-purple/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-theme-purple/30 aspect-square";
  const inner = (
    <>
      <div className="rounded-full bg-theme-purple/10 dark:bg-white/10 p-3 text-theme-purple dark:text-theme-white transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className="flex items-center gap-1 text-xs font-semibold text-theme-purple dark:text-theme-white">
        {label}
        {locked ? <Lock className="h-3 w-3 opacity-50" /> : null}
        {external ? (
          <ExternalLink className="h-3 w-3 opacity-50" />
        ) : null}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={common}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={common}>
      {inner}
    </button>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser } =
    useAuth();

  const isCommitteeMember = !!(user?.committees && user.committees.length > 0);

  const [eventSignups, setEventSignups] = useState<EventSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Show past events toggle (default: hide past events)
  const [showPastEvents, setShowPastEvents] = useState(false);

  const [minecraftUsername, setMinecraftUsername] = useState("");
  const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
  const [isSavingMinecraft, setIsSavingMinecraft] = useState(false);

  useEffect(() => {
    if (user?.minecraft_username) setMinecraftUsername(user.minecraft_username);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnTo = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (user?.id) loadEventSignups();
    else setIsLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredSignups = useMemo(() => {
    if (!eventSignups) return [];
    if (showPastEvents) return eventSignups;

    const todayStart = startOfDay(new Date());

    return eventSignups.filter((s) => {
      try {
        if (!s?.event_id?.event_date) return true;
        const eventDate = startOfDay(new Date(s.event_id.event_date));
        return !isBefore(eventDate, todayStart);
      } catch (e) {
        return true;
      }
    });
  }, [eventSignups, showPastEvents]);

  const loadEventSignups = async () => {
    if (!user?.id) return;

    try {
      setIsLoading(true);
      const signups = await getUserEventSignups(user.id);
      setEventSignups(signups);
    } catch (error) {
      console.error("Failed to load event signups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login?noAuto=true");
  };

  const handleSaveMinecraftUsername = async () => {
    if (!user?.id) return;

    setIsSavingMinecraft(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token");

      await updateMinecraftUsername(user.id, minecraftUsername, token);
      await refreshUser();
      setIsEditingMinecraft(false);
    } catch (error) {
      console.error("Failed to update minecraft username:", error);
      alert("Kon Minecraft gebruikersnaam niet bijwerken. Probeer het opnieuw.");
    } finally {
      setIsSavingMinecraft(false);
    }
  };

  const membershipStatus = useMemo(() => {
    if (!user?.membership_status || user.membership_status === "none") {
      return {
        text: "Geen Actief Lidmaatschap",
        color: "bg-gray-400",
        textColor: "text-white",
      };
    }
    if (user.membership_status === "active") {
      return {
        text: "Actief Lid",
        color: "bg-theme-purple",
        textColor: "text-white",
      };
    }
    return {
      text: "Lidmaatschap Verlopen",
      color: "bg-theme-purple/50",
      textColor: "text-white",
    };
  }, [user?.membership_status]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-theme-purple dark:text-theme-white text-xl font-semibold animate-pulse">
          Laden...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Mijn Account"
        variant="centered"
        titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-5xl drop-shadow-sm"
        description={
          <p className="text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mt-4 font-medium drop-shadow-sm mx-auto">
            Beheer je gegevens, lidmaatschap en inschrijvingen.
          </p>
        }
      >
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white bg-theme-purple hover:bg-theme-purple-light transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
        </div>
      </PageHeader>

      <main className="mx-auto max-w-app px-4 py-8 sm:py-10 md:py-12">
        <div className="rounded-3xl bg-gradient-theme p-6 sm:p-8 lg:p-12 shadow-xl">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 auto-rows-min">
            {/* Profile */}
            <Tile className="lg:col-span-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Avatar */}
                <div className="shrink-0 self-center sm:self-start">
                  {user.avatar ? (
                    <div className="relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-theme-purple/20 shadow-xl">
                      <Image
                        src={getImageUrl(user.avatar)}
                        alt={`${user.first_name} ${user.last_name}`}
                        fill
                        sizes="112px"
                        className="object-cover"
                        priority
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTEyIiBoZWlnaHQ9IjExMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTEyIiBoZWlnaHQ9IjExMiIgZmlsbD0iI2VlZSIvPjwvc3ZnPg=="
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/img/avatar-placeholder.svg";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-theme-purple/10 flex items-center justify-center border-4 border-theme-purple/20 shadow-xl">
                      <span className="text-3xl font-bold text-theme-purple dark:text-theme-white">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <h2 className="truncate text-2xl sm:text-3xl font-bold text-theme-purple dark:text-theme-white">
                    {user.first_name && user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : user.email || "User"}
                  </h2>

                  <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                    {user.is_member ? (
                      <span className="px-3 py-1 bg-theme-purple text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Fontys Student
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-theme-purple/10 text-theme-purple dark:text-theme-white text-[10px] font-black uppercase tracking-widest rounded-full">
                        Geregistreerde Gebruiker
                      </span>
                    )}

                    <span
                      className={`px-3 py-1 ${membershipStatus.color} ${membershipStatus.textColor} text-[10px] font-black uppercase tracking-widest rounded-full`}
                    >
                      {membershipStatus.text}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-theme-purple/5 border border-theme-purple/10 px-4 py-3">
                      <p className="text-[10px] text-theme-purple dark:text-theme-white/60 font-black uppercase tracking-widest mb-1">
                        Lidmaatschap eindigt
                      </p>
                      <p className="text-sm font-bold text-theme-purple dark:text-theme-white">
                        {user.membership_expiry
                          ? format(new Date(user.membership_expiry), "d MMMM yyyy")
                          : "Niet van toepassing"}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-theme-purple/5 border border-theme-purple/10 px-4 py-3">
                      <p className="text-[10px] text-theme-purple dark:text-theme-white/60 font-black uppercase tracking-widest mb-1">
                        Account
                      </p>
                      <p className="text-sm font-bold text-theme-purple dark:text-theme-white truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Tile>

            {/* Contact */}
            <Tile
              className="lg:col-span-4"
              title="Contact"
              icon={<Mail className="h-5 w-5" />}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-theme-purple/10 p-2 text-theme-purple dark:text-theme-white">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-theme-purple dark:text-theme-white/60 font-black uppercase tracking-widest">
                      E-mailadres
                    </p>
                    <p
                      className="truncate font-bold text-theme-purple dark:text-theme-white"
                      title={user.email}
                    >
                      {user.email}
                    </p>
                  </div>
                </div>

                {user.fontys_email ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-theme-purple/10 p-2 text-theme-purple dark:text-theme-white">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-theme-purple dark:text-theme-white/60 font-black uppercase tracking-widest">
                        Fontys e-mail
                      </p>
                      <p
                        className="truncate font-bold text-theme-purple dark:text-theme-white"
                        title={user.fontys_email}
                      >
                        {user.fontys_email}
                      </p>
                    </div>
                  </div>
                ) : null}

                {user.phone_number ? (
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-theme-purple/10 p-2 text-theme-purple dark:text-theme-white">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-theme-purple dark:text-theme-white/60 font-black uppercase tracking-widest">
                        Telefoonnummer
                      </p>
                      <p className="font-bold text-theme-purple dark:text-theme-white">
                        {user.phone_number}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </Tile>

            {/* Minecraft */}
            <Tile
              className="lg:col-span-4"
              title="Minecraft"
              icon={<Gamepad2 className="h-5 w-5" />}
            >
              <div className="rounded-2xl bg-theme-purple/5 p-4 border border-theme-purple/10">
                <p className="mb-2 text-[10px] font-black uppercase text-theme-purple dark:text-theme-white/60 tracking-widest">
                  Gebruikersnaam
                </p>

                {isEditingMinecraft ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={minecraftUsername}
                      onChange={(e) => setMinecraftUsername(e.target.value)}
                      className="flex-1 rounded-xl bg-white/80 dark:bg-black/20 px-3 py-2 text-sm text-theme-purple dark:text-theme-white outline-none focus:ring-2 focus:ring-theme-purple"
                      placeholder="Username"
                    />
                    <button
                      onClick={handleSaveMinecraftUsername}
                      disabled={isSavingMinecraft}
                      className="rounded-xl bg-theme-purple px-4 py-2 text-sm font-bold text-white hover:bg-theme-purple-light transition disabled:opacity-50"
                    >
                      {isSavingMinecraft ? "..." : "Opslaan"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-bold text-theme-purple dark:text-theme-white">
                      {user.minecraft_username || "Niet ingesteld"}
                    </span>
                    <button
                      onClick={() => setIsEditingMinecraft(true)}
                      className="shrink-0 rounded-xl bg-theme-purple/10 px-3 py-2 text-[10px] font-black uppercase text-theme-purple dark:text-theme-white hover:bg-theme-purple/20 transition"
                    >
                      {user.minecraft_username ? "Wijzig" : "Instellen"}
                    </button>
                  </div>
                )}
              </div>
            </Tile>

            {/* Quick links */}
            <Tile
              className="lg:col-span-8"
              title="Snelle links"
              icon={<ChevronRight className="h-5 w-5" />}
            >
              <div
                className={[
                  "grid grid-cols-2 gap-4 sm:grid-cols-4",
                ].join(" ")}
              >
                <QuickLink
                  label="Transacties"
                  icon={<CreditCard className="h-6 w-6" />}
                  onClick={() => router.push("/account/transacties")}
                />
                <QuickLink
                  label="WhatsApp"
                  icon={<MessageCircle className="h-6 w-6" />}
                  onClick={() => router.push("/account/whatsapp-groepen")}
                  locked={user.membership_status !== "active"}
                />
                <QuickLink
                  label="SharePoint"
                  icon={<FileText className="h-6 w-6" />}
                  href="https://salvemundi.sharepoint.com"
                  external
                />
                {isCommitteeMember ? (
                  <QuickLink
                    label="Admin panel"
                    icon={<Shield className="h-6 w-6" />}
                    href="https://admin.salvemundi.nl"
                    external
                  />
                ) : null}
              </div>
            </Tile>

            {/* Event signups */}
            <Tile
              className="lg:col-span-12"
              title="Mijn inschrijvingen"
              icon={<Calendar className="h-5 w-5" />}
              actions={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPastEvents((v) => !v)}
                    className="inline-flex items-center gap-2 rounded-xl bg-theme-purple/5 px-3 py-2 text-[10px] font-black uppercase text-theme-purple dark:text-theme-white hover:bg-theme-purple/10 transition border border-theme-purple/10"
                  >
                    {showPastEvents ? "Verberg oude" : "Toon oude"}
                  </button>

                  <button
                    onClick={() => router.push("/activiteiten")}
                    className="inline-flex items-center gap-1 rounded-xl bg-theme-purple px-3 py-2 text-[10px] font-black uppercase text-white hover:bg-theme-purple-light transition shadow-md"
                  >
                    Bekijk agenda <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              }
            >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-theme-purple/20 border-t-theme-purple" />
                  <p className="mt-4 text-sm font-bold text-theme-purple/60 dark:text-theme-white/60">
                    Inschrijvingen laden...
                  </p>
                </div>
              ) : eventSignups.length === 0 ? (
                <div className="rounded-3xl border-2 border-dashed border-theme-purple/20 bg-theme-purple/5 p-8 text-center">
                  <p className="text-theme-purple dark:text-theme-white font-bold">
                    Je hebt je nog niet ingeschreven voor evenementen.
                  </p>
                  <button
                    onClick={() => router.push("/activiteiten")}
                    className="mt-4 rounded-full bg-theme-purple px-8 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    Naar evenementen
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredSignups.map((signup) => {
                    const isPast = (() => {
                      try {
                        if (!signup?.event_id?.event_date) return false;
                        const eventDate = startOfDay(new Date(signup.event_id.event_date));
                        return isBefore(eventDate, startOfDay(new Date()));
                      } catch (e) {
                        return false;
                      }
                    })();

                    return (
                      <button
                        key={signup.id}
                        type="button"
                        onClick={() => router.push(`/activiteiten/${signup.event_id.id}`)}
                        className={[
                          "group flex w-full gap-4 rounded-2xl p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-theme-purple/30 border border-transparent",
                          isPast
                            ? "bg-theme-purple/5 opacity-60 grayscale"
                            : "bg-white dark:bg-black/20 hover:bg-theme-purple/5 border-theme-purple/10",
                        ].join(" ")}
                      >
                        <div className="shrink-0">
                          {signup.event_id.image ? (
                            <div className="relative h-20 w-20 rounded-xl overflow-hidden shadow-sm border border-theme-purple/10">
                              <Image
                                src={getImageUrl(signup.event_id.image)}
                                alt={signup.event_id.name}
                                fill
                                sizes="80px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWVlIi8+PC9zdmc+"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/img/placeholder.svg";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-theme-purple/10 text-theme-purple dark:text-theme-white transition-transform duration-300 group-hover:scale-105">
                              <Calendar className="h-8 w-8" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-bold text-theme-purple dark:text-theme-white">
                            {signup.event_id.name}
                          </h3>

                          <div className="mt-1 space-y-1">
                            <p className="flex items-center gap-2 text-xs font-bold text-theme-purple/70 dark:text-theme-white/70">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(signup.event_id.event_date), "d MMMM yyyy")}
                            </p>
                            <p className="text-[10px] text-theme-purple/50 dark:text-theme-white/50 font-medium italic">
                              Ingeschreven op: {format(new Date(signup.created_at), "d MMM yyyy")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-center text-theme-purple/30 dark:text-theme-white/30 transition-transform group-hover:translate-x-1">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Tile>
          </div>
        </div>
      </main>
    </div>
  );
}
