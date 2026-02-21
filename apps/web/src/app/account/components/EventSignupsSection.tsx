"use client";

import { useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { getImageUrl } from "@/shared/lib/api/image";
import { format, startOfDay, isBefore } from "date-fns";
import { Calendar, ChevronRight } from "lucide-react";
import { EventSignup } from "@/shared/model/types/auth";

interface EventSignupsSectionProps {
    initialSignups: EventSignup[];
}

export default function EventSignupsSection({ initialSignups }: EventSignupsSectionProps) {
    const router = useRouter();
    const [showPastEvents, setShowPastEvents] = useState(false);

    const filteredSignups = useMemo(() => {
        if (showPastEvents) return initialSignups;
        const todayStart = startOfDay(new Date());
        return initialSignups.filter((s) => {
            try {
                if (!s?.event_id?.event_date) return true;
                return !isBefore(startOfDay(new Date(s.event_id.event_date)), todayStart);
            } catch {
                return true;
            }
        });
    }, [initialSignups, showPastEvents]);

    if (initialSignups.length === 0) {
        return (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-black/10 p-12 text-center shadow-inner">
                <p className="text-theme-purple dark:text-white font-bold text-lg mb-2">
                    Je hebt je nog niet ingeschreven voor evenementen.
                </p>
                <p className="text-theme-purple/60 dark:text-white/60 text-sm mb-6">
                    Bekijk de kalender om aankomende activiteiten te ontdekken
                </p>
                <button
                    onClick={() => router.push("/activiteiten")}
                    className="inline-flex items-center gap-2 rounded-full bg-theme-purple px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl hover:bg-theme-purple-light"
                >
                    Ontdek evenementen
                </button>
            </div>
        );
    }

    return (
        <>
            {/* Actions bar (passed as actions prop externally — here rendered inline) */}
            <div className="mb-4 flex items-center justify-end gap-3">
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

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {filteredSignups.map((signup) => {
                    const isPast = (() => {
                        try {
                            if (!signup?.event_id?.event_date) return false;
                            return isBefore(
                                startOfDay(new Date(signup.event_id.event_date)),
                                startOfDay(new Date())
                            );
                        } catch {
                            return false;
                        }
                    })();

                    return (
                        <button
                            key={signup.id}
                            type="button"
                            onClick={() => router.push(`/activiteiten/${signup.event_id.id}`)}
                            className={[
                                "group h-full flex flex-col gap-4 rounded-3xl p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-theme-purple/30 border shadow-sm",
                                isPast
                                    ? "bg-slate-50 dark:bg-black/10 opacity-60 grayscale border-slate-200 dark:border-white/5"
                                    : "bg-slate-50 dark:bg-black/20 border-slate-200 dark:border-white/10 hover:shadow-lg hover:border-theme-purple/30 dark:hover:border-white/20 hover:-translate-y-0.5",
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
                                                    (e.target as HTMLImageElement).src =
                                                        "/img/placeholder.svg";
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
                                        {format(
                                            new Date(
                                                signup.event_id.event_date.includes("T") ||
                                                    signup.event_id.event_date.includes(" ")
                                                    ? signup.event_id.event_date
                                                    : `${signup.event_id.event_date}T12:00:00`
                                            ),
                                            "d MMM yyyy"
                                        )}
                                    </p>
                                    <p className="text-[10px] text-theme-purple/40 dark:text-white/40 font-medium italic">
                                        Inschrijving:{" "}
                                        {format(new Date(signup.created_at), "d MMM yyyy")}
                                    </p>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
