'use client';

import { Suspense, useMemo, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format, startOfDay, isBefore } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
    Gamepad2, Mail, Phone, Calendar, Upload, 
    Check, X, Loader2, Users2, ChevronRight, 
    CreditCard, MessageCircle, FileText, Shield, Lock, ExternalLink, Edit2, Save
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import type { EventSignup } from '@salvemundi/validations';
import { updateUserProfile } from '@/server/actions/profiel-update.actions';

interface ProfielIslandProps {
    initialSignups: EventSignup[];
    user: Record<string, any>;
    publicUrl: string;
}

// Helper component for Tiles
function Tile({
    title, icon, children, className = "", actions
}: {
    title?: string; icon?: React.ReactNode; children: React.ReactNode;
    className?: string; actions?: React.ReactNode;
}) {
    return (
        <section className={`relative overflow-hidden rounded-3xl bg-[var(--bg-card)] dark:border dark:border-white/10 shadow-lg ${className}`}>
            <div className="relative p-6 sm:p-8">
                {(title || actions) && (
                    <header className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                            {icon && (
                                <div className="shrink-0 rounded-2xl bg-[var(--color-purple-100)] p-2.5 text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)]">
                                    {icon}
                                </div>
                            )}
                            {title && (
                                <h2 className="min-w-0 break-words whitespace-normal text-xl sm:text-2xl font-bold text-[var(--color-purple-700)] dark:text-white">
                                    {title}
                                </h2>
                            )}
                        </div>
                        {actions && <div className="w-full sm:w-auto flex justify-start sm:justify-end">{actions}</div>}
                    </header>
                )}
                <div className="text-[var(--text-main)]">{children}</div>
            </div>
        </section>
    );
}

function QuickLink({
    label, icon, onClick, href, locked, external
}: {
    label: string; icon: React.ReactNode; onClick?: () => void;
    href?: string; locked?: boolean; external?: boolean;
}) {
    const common = "group flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 transition-all hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-purple-300)] border border-slate-200 dark:border-white/10 hover:border-[var(--color-purple-300)] shadow-sm w-full hover:-translate-y-0.5";
    const inner = (
        <>
            <div className="rounded-xl bg-[var(--color-purple-100)] p-2.5 text-[var(--color-purple-700)] dark:text-[var(--color-purple-300)] transition-transform group-hover:scale-110 shadow-sm">
                {icon}
            </div>
            <span className="flex-1 flex items-center justify-between text-sm font-bold text-[var(--color-purple-700)] dark:text-white">
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    {locked && <Lock className="h-3 w-3 opacity-50" />}
                    {external && <ExternalLink className="h-3 w-3 opacity-50" />}
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
            </span>
        </>
    );

    if (href) {
        return (
            <Link href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className={common}>
                {inner}
            </Link>
        );
    }
    return <button type="button" onClick={onClick} className={common}>{inner}</button>;
}

export const ProfielIsland: React.FC<ProfielIslandProps> = ({ initialSignups, user: initialUser, publicUrl }) => {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    // Prefer real-time session user, fallback to server-fetched initialUser
    const user: any = session?.user || initialUser;

    const [eventSignups] = useState<EventSignup[]>(initialSignups || []);
    const [showPastEvents, setShowPastEvents] = useState(false);

    // Profile editing states (Visual only for now, would need actual API endpoints)
    const [minecraftUsername, setMinecraftUsername] = useState(user?.minecraft_username || "");
    const [isEditingMinecraft, setIsEditingMinecraft] = useState(false);
    const [isSavingMinecraft, setIsSavingMinecraft] = useState(false);
    
    const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
    const [isEditingPhoneNumber, setIsEditingPhoneNumber] = useState(false);
    const [isSavingPhoneNumber, setIsSavingPhoneNumber] = useState(false);

    const handleSaveMinecraft = async () => {
        setIsSavingMinecraft(true);
        await updateUserProfile({ minecraft_username: minecraftUsername });
        setIsSavingMinecraft(false);
        setIsEditingMinecraft(false);
    };

    const handleSavePhone = async () => {
        setIsSavingPhoneNumber(true);
        await updateUserProfile({ phone_number: phoneNumber });
        setIsSavingPhoneNumber(false);
        setIsEditingPhoneNumber(false);
    };
    
    // Derived values
    const isCommitteeMember = Array.isArray(user.committees) && user.committees.length > 0;
    
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

    const membershipStatus = useMemo(() => {
        const isLeader = Array.isArray(user.committees) && user.committees.some((c: any) => c.is_leader);
        const isInCommittee = isCommitteeMember;
        const isMember = user.is_member;
        const status = user.membership_status;

        let role = "Gebruiker";
        if (isLeader) role = "Commissie Leider";
        else if (isInCommittee) role = "Actief Lid";
        else if (isMember) role = "Lid";

        let statusText = "Geen Lidmaatschap";
        if (status === "active") statusText = "Lidmaatschap Actief";
        else if (status === "expired") statusText = "Lidmaatschap Verlopen";

        let color = "bg-slate-100 dark:bg-white/5 border border-[var(--color-purple-200)] text-[var(--color-purple-700)] dark:text-white";
        let textColor = "text-[var(--color-purple-700)] dark:text-white font-bold";

        if (status === "active") {
            if (isLeader) {
                color = "bg-gradient-to-r from-[var(--color-purple-500)] to-[var(--color-purple-400)] shadow-lg";
                textColor = "text-white";
            } else if (isInCommittee || isMember) {
                color = "bg-[var(--color-purple-500)] shadow-lg";
                textColor = "text-white";
            }
        } else if (status === "expired") {
            color = "bg-red-500/80 shadow-lg";
            textColor = "text-white";
        }

        return { text: `${role} • ${statusText}`, color, textColor };
    }, [user, isCommitteeMember]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Column */}
            <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">
                <Tile className="h-fit">
                    <div className="flex flex-col gap-6 items-center text-center">
                        <div className="relative group shrink-0">
                            <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-[var(--color-purple-100)] shadow-lg">
                                {user.image ? (
                                    <Image
                                        src={user.image}
                                        alt={user.name || "Avatar"}
                                        fill
                                        sizes="128px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full bg-[var(--color-purple-50)] border border-[var(--color-purple-100)] flex items-center justify-center">
                                        <span className="text-4xl font-bold text-[var(--color-purple-300)]">
                                            {user.name?.[0] || user.email?.[0] || '?'}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="min-w-0 w-full">
                            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--color-purple-700)] dark:text-white break-words">
                                {user.name || user.email || "User"}
                            </h2>

                            <div className="mt-4 flex flex-wrap justify-center">
                                <span className={`px-6 py-2 ${membershipStatus.color} ${membershipStatus.textColor} text-[11px] font-black uppercase tracking-wider rounded-full shadow-md transition-all`}>
                                    {membershipStatus.text}
                                </span>
                            </div>

                            {/* Committees */}
                            {Array.isArray(user.committees) && user.committees.length > 0 && (
                                <div className="mt-6">
                                    <p className="text-[10px] text-[var(--color-purple-400)] font-black uppercase tracking-wider mb-3 text-center">
                                        Mijn Commissies
                                    </p>
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {user.committees.map((committee: any) => (
                                            <span
                                                key={committee.id || committee.name}
                                                className="group relative inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-purple-50)] dark:bg-white/10 border border-[var(--color-purple-100)] dark:border-white/20 rounded-full text-xs font-bold text-[var(--color-purple-700)] dark:text-white shadow-sm"
                                            >
                                                {committee.is_leader && (
                                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 border-2 border-[var(--bg-card)] shadow-md flex items-center justify-center">
                                                        <span className="text-[8px]">⭐</span>
                                                    </span>
                                                )}
                                                <Users2 className="h-3.5 w-3.5" />
                                                <span>{committee.name.replace(/\s*(\|\||[-–—])\s*SALVE MUNDI\s*$/gi, '').trim()}</span>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 flex flex-col gap-3">
                                <div className="rounded-2xl bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 px-5 py-4 shadow-sm">
                                    <p className="text-[10px] text-[var(--color-purple-400)] font-black uppercase tracking-wider mb-1.5">
                                        Lidmaatschap tot
                                    </p>
                                    <p className="text-base font-bold text-[var(--color-purple-700)] dark:text-white">
                                        {user.membership_expiry 
                                            ? format(new Date(user.membership_expiry), "d MMM yyyy", { locale: nl })
                                            : "Niet van toepassing"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Tile>

                {/* Social Gaming Tile */}
                <Tile title="Social Gaming" icon={<Gamepad2 className="h-5 w-5" />} className="h-fit">
                    <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm relative group">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                                Minecraft Username
                            </p>
                            {!isEditingMinecraft && (
                                <button onClick={() => setIsEditingMinecraft(true)} className="text-[var(--text-muted)] hover:text-[var(--color-purple-500)] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-3 min-w-0">
                            <Gamepad2 className="h-5 w-5 text-[var(--color-purple-300)]" />
                            {isEditingMinecraft ? (
                                <div className="flex w-full items-center gap-2">
                                    <input 
                                        type="text" 
                                        value={minecraftUsername}
                                        onChange={(e) => setMinecraftUsername(e.target.value)}
                                        className="flex-1 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-purple-500)] focus:border-transparent outline-none"
                                        placeholder="Username"
                                    />
                                    <button onClick={handleSaveMinecraft} disabled={isSavingMinecraft} className="p-1.5 bg-[var(--color-purple-500)] text-white rounded-lg hover:bg-[var(--color-purple-600)] transition-colors">
                                        {isSavingMinecraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </button>
                                    <button onClick={() => { setIsEditingMinecraft(false); setMinecraftUsername(user?.minecraft_username || ""); }} className="p-1.5 bg-slate-200 dark:bg-white/10 text-[var(--text-main)] rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <p className="break-words font-bold text-[var(--color-purple-700)] dark:text-white text-base">
                                    {minecraftUsername || "Niet ingesteld"}
                                </p>
                            )}
                        </div>
                    </div>
                </Tile>
            </div>

            {/* Right Column */}
            <div className="md:col-span-12 lg:col-span-8 flex flex-col gap-6">
                <Tile title="Mijn gegevens" icon={<Mail className="h-5 w-5" />} className="h-fit">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                            <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] text-[var(--color-purple-400)] font-bold uppercase tracking-wide mb-1">
                                    E-mailadres
                                </p>
                                <p className="font-bold text-[var(--color-purple-700)] dark:text-white truncate text-sm" title={user.email}>
                                    {user.email || 'Geen email'}
                                </p>
                            </div>
                        </div>

                        {user.fontys_email && (
                            <div className="flex items-center gap-4 rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                                <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                                    <Mail className="h-5 w-5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-[11px] text-[var(--color-purple-400)] font-bold uppercase tracking-wide mb-1">
                                        Fontys e-mail
                                    </p>
                                    <p className="font-bold text-[var(--color-purple-700)] dark:text-white truncate text-sm" title={user.fontys_email}>
                                        {user.fontys_email}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm relative group">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                                    Telefoonnummer
                                </p>
                                {!isEditingPhoneNumber && (
                                    <button onClick={() => setIsEditingPhoneNumber(true)} className="text-[var(--text-muted)] hover:text-[var(--color-purple-500)] p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                                    <Phone className="h-5 w-5" />
                                </div>
                                {isEditingPhoneNumber ? (
                                    <div className="flex w-full items-center gap-2">
                                        <input 
                                            type="tel" 
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className="flex-1 min-w-0 bg-white dark:bg-black/40 border border-slate-300 dark:border-white/20 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-[var(--color-purple-500)] focus:border-transparent outline-none"
                                            placeholder="0612345678"
                                        />
                                        <button onClick={handleSavePhone} disabled={isSavingPhoneNumber} className="shrink-0 p-1.5 bg-[var(--color-purple-500)] text-white rounded-lg hover:bg-[var(--color-purple-600)] transition-colors">
                                            {isSavingPhoneNumber ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        </button>
                                        <button onClick={() => { setIsEditingPhoneNumber(false); setPhoneNumber(user?.phone_number || ""); }} className="shrink-0 p-1.5 bg-slate-200 dark:bg-white/10 text-[var(--text-main)] rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <p className="font-bold text-[var(--color-purple-700)] dark:text-white text-sm">
                                        {phoneNumber || "Niet ingesteld"}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-2xl bg-slate-50 dark:bg-black/20 p-5 border border-slate-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <p className="text-[11px] font-bold uppercase text-[var(--color-purple-400)] tracking-wide text-left">
                                    Geboortedatum
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="shrink-0 rounded-xl bg-[var(--color-purple-100)] p-3 text-[var(--color-purple-600)] shadow-sm">
                                    <Calendar className="h-5 w-5" />
                                </div>
                                <p className="font-bold text-[var(--color-purple-700)] dark:text-white text-sm">
                                    {user.date_of_birth ? format(new Date(user.date_of_birth), "d MMMM yyyy", { locale: nl }) : "Niet ingesteld"}
                                </p>
                            </div>
                        </div>
                    </div>
                </Tile>

                {/* Quick links */}
                <Tile title="Snelle links" icon={<ChevronRight className="h-5 w-5" />} className="h-fit">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <QuickLink
                            label="Lidmaatschap"
                            icon={<CreditCard className="h-6 w-6" />}
                            href="/lidmaatschap"
                        />
                        <QuickLink
                            label="Transacties"
                            icon={<CreditCard className="h-6 w-6" />}
                            href="/profiel/transacties"
                        />
                        <QuickLink
                            label="WhatsApp"
                            icon={<MessageCircle className="h-6 w-6" />}
                            href="/profiel/whatsapp"
                            locked={user.membership_status !== "active"}
                        />
                        {isCommitteeMember && (
                            <QuickLink
                                label="Admin panel"
                                icon={<Shield className="h-6 w-6" />}
                                href="https://admin.salvemundi.nl"
                                external
                            />
                        )}
                    </div>
                </Tile>
            </div>

            {/* Bottom Column: Signups */}
            <div className="md:col-span-12">
                <Tile
                    title="Mijn inschrijvingen"
                    icon={<Calendar className="h-5 w-5" />}
                    className="h-fit"
                    actions={
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowPastEvents((v) => !v)}
                                className="inline-flex items-center justify-center rounded-xl bg-[var(--color-purple-50)] px-4 py-2 text-[10px] font-black uppercase text-[var(--color-purple-700)] hover:bg-[var(--color-purple-100)] transition border border-[var(--color-purple-100)]"
                            >
                                {showPastEvents ? "Verberg oude" : "Toon oude"}
                            </button>
                            <Link
                                href="/activiteiten"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-purple-500)] px-4 py-2 text-[10px] font-black uppercase text-white hover:bg-[var(--color-purple-600)] transition shadow-lg"
                            >
                                Kalender <ChevronRight className="h-3 w-3" />
                            </Link>
                        </div>
                    }
                >
                    {filteredSignups.length === 0 ? (
                        <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/10 p-12 text-center shadow-inner">
                            <p className="text-[var(--color-purple-700)] dark:text-white font-bold text-lg mb-2">
                                Je hebt je nog niet ingeschreven voor evenementen.
                            </p>
                            <p className="text-[var(--text-muted)] text-sm mb-6">
                                Bekijk de kalender om aankomende activiteiten te ontdekken
                            </p>
                            <Link
                                href="/activiteiten"
                                className="inline-flex items-center gap-2 rounded-full bg-[var(--color-purple-500)] px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
                            >
                                Ontdek evenementen
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSignups.map((signup) => {
                                const isPast = (() => {
                                    try {
                                        if (!signup.event_id?.event_date) return false;
                                        return isBefore(startOfDay(new Date(signup.event_id.event_date)), startOfDay(new Date()));
                                    } catch (e) { return false; }
                                })();

                                return (
                                    <Link
                                        key={signup.id}
                                        href={`/activiteiten/${signup.event_id.id}`}
                                        className={`group h-full flex items-center justify-between gap-4 rounded-3xl p-5 text-left transition-all border shadow-sm ${
                                            isPast 
                                            ? "bg-slate-50 dark:bg-black/10 opacity-60 grayscale border-slate-200 dark:border-white/5" 
                                            : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:shadow-lg hover:-translate-y-0.5"
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="shrink-0 h-16 w-16 flex items-center justify-center rounded-2xl bg-[var(--color-purple-100)] text-[var(--color-purple-500)] shadow-sm">
                                                 <Calendar className="h-7 w-7" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[var(--color-purple-700)] dark:text-white line-clamp-1">
                                                    {signup.event_id.name}
                                                </h3>
                                                <p className="mt-1 flex items-center gap-2 text-xs font-bold text-[var(--text-muted)]">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {format(new Date(signup.event_id.event_date), "d MMM yyyy", { locale: nl })}
                                                </p>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-6 w-6 shrink-0 text-[var(--color-purple-200)] transition-transform group-hover:translate-x-1" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </Tile>
            </div>
        </div>
    );
};
