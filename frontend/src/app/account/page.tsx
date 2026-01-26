"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { getUserEventSignups, updateMinecraftUsername } from "@/shared/lib/auth";
import { getImageUrl } from "@/shared/lib/api/salvemundi";
import { format, startOfDay, isBefore } from "date-fns";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
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
  Upload,
  Loader2,
  Check,
  X,
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
  centeredTitle,
}: {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  centeredTitle?: boolean;
}) {
  return (
    <section
      className={[
        "relative overflow-hidden rounded-3xl bg-white dark:bg-surface-dark shadow-xl border border-theme-purple/5",
        className,
      ].join(" ")}
    >
      <div className="relative p-6 sm:p-8">
        {(title || actions) && (
          <header className={`mb-8 flex items-center gap-4 ${centeredTitle ? 'flex-col justify-center text-center' : 'justify-between'}`}>
            <div className={`flex min-w-0 items-center gap-3 ${centeredTitle ? 'flex-col' : ''}`}>
              {icon ? (
                <div className={`shrink-0 rounded-2xl bg-theme-purple/5 text-theme-purple dark:text-theme-purple-light transition-all ${centeredTitle ? 'p-3 mb-3' : 'p-2'}`}>
                  {React.cloneElement(icon as React.ReactElement, {
                    className: centeredTitle ? "h-6 w-6 sm:h-8 sm:w-8" : "h-5 w-5"
                  })}
                </div>
              ) : null}
              {title ? (
                <h2
                  className={`font-black text-theme-purple dark:text-white uppercase tracking-[0.2em] transition-all`}
                  style={{ fontSize: centeredTitle ? 'var(--font-size-2xl)' : 'var(--font-size-xl)' }}
                >
                  {title}
                </h2>
              ) : null}
            </div>

            {actions ? <div className={`shrink-0 ${centeredTitle ? 'mt-4' : ''}`}>{actions}</div> : null}
          </header>
        )}

        <div className="text-theme-text dark:text-white/80">
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
    "group flex flex-col items-center justify-center gap-3 rounded-2xl bg-theme-purple/5 dark:bg-white/5 p-4 text-center transition hover:bg-theme-purple/10 dark:hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-theme-purple/30 aspect-square border border-transparent hover:border-theme-purple/20 shadow-sm";
  const inner = (
    <>
      <div className="rounded-full bg-theme-purple/10 dark:bg-white/10 p-4 text-theme-purple dark:text-white transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className="flex items-center gap-1.5 text-sm font-bold text-theme-purple/90 dark:text-white/90">
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
  const { user, isAuthenticated, isLoading: authLoading, logout, refreshUser, isLoggingOut } =
    useAuth();
  const fileInputRef = useMemo(() => ({ current: null as HTMLInputElement | null }), []);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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
    if (!authLoading && !isAuthenticated && !isLoggingOut) {
      const returnTo = window.location.pathname + window.location.search;
      router.push(`/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [isAuthenticated, authLoading, router, isLoggingOut]);

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

    // Clear any stored return URL to prevent auto-redirects after logout
    try {
      localStorage.removeItem('auth_return_to');
    } catch (e) {
      // ignore
    }

    // Perform the logout cleanup (clearing tokens, MSAL cache, etc.)
    // We await this to ensure all session data is cleared before we leave the page.
    await logout();

    // Force a full page reload to the homepage. This breaks the React lifecycle
    // and prevents any pending effects (like the auto-redirect to login) from firing.
    // Full reload ensures MSAL internal state is completely reset.
    if (typeof window !== 'undefined') {
      window.location.href = "/?noAuto=true";
    }
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

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleCancelAvatar = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmAvatar = async () => {
    if (!selectedFile || !user?.id) return;

    setIsUploadingAvatar(true);
    try {
      const token = localStorage.getItem("auth_token");
      const fd = new FormData();
      fd.append("file", selectedFile);

      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Upload the file to Directus
      const uploadResp = await fetch(`${window.location.origin}/api/files`, {
        method: "POST",
        body: fd,
        headers,
      });

      if (!uploadResp.ok) throw new Error("Upload failed");
      const uploadJson = await uploadResp.json();
      const fileId = uploadJson?.data?.id || uploadJson?.data;

      if (!fileId) throw new Error("No file ID returned");

      // 2. Update the user's avatar in Directus
      const updateResp = await fetch(`${window.location.origin}/api/users/me`, {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatar: fileId }),
      });

      if (!updateResp.ok) throw new Error("Failed to update user profile");

      // 3. Refresh user data to show the new avatar
      await refreshUser();
      handleCancelAvatar(); // Cleanup
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Kon profielfoto niet bijwerken. Probeer het opnieuw.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const membershipStatus = useMemo(() => {
    if (!user?.membership_status || user.membership_status === "none") {
      return {
        text: "Geen Actief Lidmaatschap",
        color: "bg-gray-400 dark:bg-gray-600",
        textColor: "text-white",
      };
    }
    if (user.membership_status === "active") {
      return {
        text: "Actief Lid",
        color: "bg-theme-purple dark:bg-theme-purple",
        textColor: "text-white",
      };
    }
    return {
      text: "Lidmaatschap Verlopen",
      color: "bg-theme-purple/50 dark:bg-theme-purple/50",
      textColor: "text-white",
    };
  }, [user?.membership_status]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-theme-purple dark:text-white text-xl font-semibold animate-pulse">
          Laden...
        </div>
      </div>
    );
  }

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

      <main className="mx-auto max-w-app px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-12 auto-rows-min items-start">
          {/* Profile */}
          <Tile className="md:col-span-5 lg:col-span-4 lg:row-span-1 h-fit">
            <div className="flex flex-col gap-6 items-center text-center">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <input
                  type="file"
                  ref={(el) => { fileInputRef.current = el; }}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className={`relative h-32 w-32 sm:h-40 sm:w-40 rounded-full overflow-hidden border-4 shadow-lg transition-all ${previewUrl ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-theme-purple/10'}`}>
                  {previewUrl ? (
                    <>
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        sizes="160px"
                        className="object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-full h-full border-[16px] border-black/20 rounded-full"></div>
                      </div>
                      <div className="absolute bottom-2 left-0 right-0 text-center">
                        <span className="bg-green-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg">
                          Voorvertoning
                        </span>
                      </div>
                    </>
                  ) : user.avatar ? (
                    <Image
                      src={getImageUrl(user.avatar)}
                      alt={`${user.first_name} ${user.last_name}`}
                      fill
                      sizes="160px"
                      className="object-cover"
                      priority
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/img/avatar-placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-theme-purple/5 flex items-center justify-center">
                      <span className="text-5xl font-bold text-theme-purple dark:text-white">
                        {user.first_name?.[0]}
                        {user.last_name?.[0]}
                      </span>
                    </div>
                  )}

                  {/* Overlay on hover (only when no preview) */}
                  {!previewUrl && (
                    <div
                      onClick={handleAvatarClick}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                    >
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Mobile change button or confirmation buttons */}
                {previewUrl ? (
                  <div className="absolute -bottom-2 flex gap-2">
                    <button
                      onClick={handleConfirmAvatar}
                      disabled={isUploadingAvatar}
                      className="h-10 w-10 rounded-full bg-green-500 text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark hover:scale-105 transition-transform"
                      title="Bevestigen"
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Check className="h-5 w-5" />
                      )}
                    </button>
                    <button
                      onClick={handleCancelAvatar}
                      disabled={isUploadingAvatar}
                      className="h-10 w-10 rounded-full bg-red-500 text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark hover:scale-105 transition-transform"
                      title="Annuleren"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-1 right-1 h-10 w-10 rounded-full bg-theme-purple text-white shadow-xl flex items-center justify-center border-2 border-white dark:border-surface-dark sm:hidden"
                  >
                    <Upload className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 w-full">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-theme-purple dark:text-white break-words">
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email || "User"}
                </h2>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {user.is_member ? (
                    <span className="px-3 py-1 bg-theme-purple text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      Fontys Student
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-theme-purple/5 border border-theme-purple/10 text-theme-purple dark:text-white text-[9px] font-black uppercase tracking-widest rounded-full">
                      Gebruiker
                    </span>
                  )}

                  <span
                    className={`px-3 py-1 ${membershipStatus.color} ${membershipStatus.textColor} text-[9px] font-black uppercase tracking-widest rounded-full shadow-sm`}
                  >
                    {membershipStatus.text}
                  </span>
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <div className="rounded-2xl bg-theme-purple/5 border border-theme-purple/10 px-4 py-3">
                    <p className="text-[9px] text-theme-purple/60 dark:text-white/40 font-black uppercase tracking-widest mb-1">
                      Lidmaatschap tot
                    </p>
                    <p className="text-sm font-bold text-theme-purple dark:text-white">
                      {user.membership_expiry
                        ? format(new Date(user.membership_expiry), "d MMM yyyy")
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Tile>

          <Tile
            className="md:col-span-7 lg:col-span-8 h-fit"
            title="Mijn gegevens"
            icon={<Mail />}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-4 rounded-2xl bg-theme-purple/5 p-4 border border-theme-purple/5">
                <div className="shrink-0 rounded-xl bg-white/50 dark:bg-black/20 p-2.5 text-theme-purple dark:text-white shadow-sm">
                  <Mail className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-theme-purple/40 dark:text-white/30 font-black uppercase tracking-wider mb-0.5">
                    E-mailadres
                  </p>
                  <p
                    className="font-bold text-theme-purple dark:text-white truncate"
                    style={{ fontSize: 'var(--font-size-base)' }}
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </div>
              </div>

              {user.fontys_email ? (
                <div className="flex items-center gap-4 rounded-2xl bg-theme-purple/5 p-4 border border-theme-purple/5">
                  <div className="shrink-0 rounded-xl bg-white/50 dark:bg-black/20 p-2.5 text-theme-purple dark:text-white shadow-sm">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-theme-purple/40 dark:text-white/30 font-black uppercase tracking-wider mb-0.5">
                      Fontys e-mail
                    </p>
                    <p
                      className="font-bold text-theme-purple dark:text-white truncate"
                      style={{ fontSize: 'var(--font-size-base)' }}
                      title={user.fontys_email}
                    >
                      {user.fontys_email}
                    </p>
                  </div>
                </div>
              ) : null}

              {user.phone_number ? (
                <div className="flex items-center gap-4 rounded-2xl bg-theme-purple/5 p-4 border border-theme-purple/5">
                  <div className="shrink-0 rounded-xl bg-white/50 dark:bg-black/20 p-2.5 text-theme-purple dark:text-white shadow-sm">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-theme-purple/40 dark:text-white/30 font-black uppercase tracking-wider mb-0.5">
                      Telefoonnummer
                    </p>
                    <p
                      className="font-bold text-theme-purple dark:text-white"
                      style={{ fontSize: 'var(--font-size-base)' }}
                    >
                      {user.phone_number}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </Tile>

          {/* Minecraft */}
          <Tile
            className="lg:col-span-4 h-fit"
            title="Social Gaming"
            icon={<Gamepad2 className="h-5 w-5" />}
            centeredTitle
          >
            <div className="rounded-2xl bg-theme-purple/5 p-5 border border-theme-purple/10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <p className="text-[10px] font-black uppercase text-theme-purple/60 dark:text-white/40 tracking-widest">
                  Minecraft Username
                </p>
                {!isEditingMinecraft && (
                  <button
                    onClick={() => setIsEditingMinecraft(true)}
                    className="shrink-0 rounded-xl bg-theme-purple/10 px-3 py-1.5 text-[9px] font-black uppercase text-theme-purple dark:text-white hover:bg-theme-purple/20 transition shadow-sm border border-theme-purple/10"
                  >
                    {user.minecraft_username ? "Wijzig" : "Instellen"}
                  </button>
                )}
              </div>

              {isEditingMinecraft ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={minecraftUsername}
                    onChange={(e) => setMinecraftUsername(e.target.value)}
                    className="flex-1 rounded-xl bg-white dark:bg-black/40 px-3.5 py-2 text-sm text-theme-purple dark:text-white outline-none focus:ring-2 focus:ring-theme-purple shadow-inner"
                    placeholder="Username"
                  />
                  <button
                    onClick={handleSaveMinecraftUsername}
                    disabled={isSavingMinecraft}
                    className="rounded-xl bg-theme-purple px-4 py-2 text-sm font-bold text-white hover:bg-theme-purple-light transition disabled:opacity-50 shadow-md"
                  >
                    {isSavingMinecraft ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditingMinecraft(false)}
                    className="rounded-xl bg-theme-purple/5 px-3 py-2 text-sm font-bold text-theme-purple dark:text-white border border-theme-purple/10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="min-w-0">
                  <p
                    className="break-words font-bold text-theme-purple dark:text-white"
                    style={{ fontSize: 'var(--font-size-lg)' }}
                  >
                    {user.minecraft_username || "Niet ingesteld"}
                  </p>
                </div>
              )}
            </div>
          </Tile>

          {/* Quick links */}
          <Tile
            className="lg:col-span-8 h-fit"
            title="Snelle links"
            icon={<ChevronRight className="h-5 w-5" />}
            centeredTitle
          >
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
            className="lg:col-span-12 h-fit"
            title="Mijn inschrijvingen"
            icon={<Calendar className="h-5 w-5" />}
            centeredTitle
            actions={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowPastEvents((v) => !v)}
                  className="inline-flex items-center justify-center rounded-xl bg-theme-purple/5 px-4 py-2 text-[10px] font-black uppercase text-theme-purple dark:text-white hover:bg-theme-purple/10 transition border border-theme-purple/10"
                >
                  {showPastEvents ? "Verberg oude" : "Toon oude"}
                </button>

                <button
                  onClick={() => router.push("/activiteiten")}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-theme-purple px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-theme-purple-light transition shadow-lg"
                >
                  Kalender <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            }
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-theme-purple/10 border-t-theme-purple" />
                <p className="mt-4 text-sm font-bold text-theme-purple/50 dark:text-white/40">
                  Inschrijvingen laden...
                </p>
              </div>
            ) : eventSignups.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-theme-purple/20 bg-theme-purple/5 p-12 text-center">
                <p className="text-theme-purple dark:text-white font-bold text-lg">
                  Je hebt je nog niet ingeschreven voor evenementen.
                </p>
                <button
                  onClick={() => router.push("/activiteiten")}
                  className="mt-6 rounded-full bg-theme-purple px-10 py-3 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-theme-purple-light"
                >
                  Ontdek evenementen
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
                        "group h-full flex flex-col gap-4 rounded-3xl p-5 text-left transition focus:outline-none focus:ring-2 focus:ring-theme-purple/30 border border-theme-purple/10 shadow-sm",
                        isPast
                          ? "bg-theme-purple/5 opacity-60 grayscale border-transparent"
                          : "bg-white dark:bg-black/20 hover:bg-theme-purple/5 hover:border-theme-purple/30",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="shrink-0">
                          {signup.event_id.image ? (
                            <div className="relative h-16 w-16 rounded-2xl overflow-hidden shadow-md border border-theme-purple/10">
                              <Image
                                src={getImageUrl(signup.event_id.image)}
                                alt={signup.event_id.name}
                                fill
                                sizes="64px"
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                                placeholder="blur"
                                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjZWVlIi8+PC9zdmc+"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "/img/placeholder.svg";
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-theme-purple/10 text-theme-purple dark:text-white shadow-sm">
                              <Calendar className="h-7 w-7" />
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 text-theme-purple/20 dark:text-white/20 transition-transform group-hover:translate-x-1">
                          <ChevronRight className="h-6 w-6" />
                        </span>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-theme-purple dark:text-white line-clamp-1">
                          {signup.event_id.name}
                        </h3>

                        <div className="mt-2.5 space-y-1.5">
                          <p className="flex items-center gap-2 text-xs font-bold text-theme-purple/70 dark:text-white/70">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(signup.event_id.event_date), "d MMM yyyy")}
                          </p>
                          <p className="text-[10px] text-theme-purple/40 dark:text-white/40 font-medium italic">
                            Inschrijving: {format(new Date(signup.created_at), "d MMM yyyy")}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Tile>
        </div>
      </main>
    </div>
  );
}
