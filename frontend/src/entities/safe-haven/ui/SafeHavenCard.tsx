'use client';

import Image from 'next/image';
import { Mail, Phone, Clock } from 'lucide-react';
import { getImageUrl } from '@/shared/lib/api/salvemundi';

interface SafeHaven {
    id: number;
    contact_name: string;
    email?: string;
    phone_number?: string;
    image?: string;
    is_available_today?: boolean;
    availability_times?: Array<{ start: string; end: string }>;
    availability_week?: Array<{ day: string; isAvailable: boolean; timeSlots: Array<{ start: string; end: string }> }>;
    user_id?: {
        first_name: string;
        last_name: string;
    };
}

interface SafeHavenCardProps {
    safeHaven: SafeHaven;
}

const SafeHavenCard: React.FC<SafeHavenCardProps> = ({ safeHaven }) => {
    // Format time string from HH:mm to more readable format
    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        return `${hours}:${minutes}`;
    };

    return (
        <div
            className="bg-[var(--bg-card)] dark:border dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg p-5 sm:p-6 transition-all hover:shadow-xl hover:scale-[1.02] duration-300 w-full flex flex-col h-full min-h-[280px]"
        >
            {/* Profile Image */}
            {safeHaven.image ? (
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 mx-auto mb-4">
                    <Image
                        src={getImageUrl(safeHaven.image)}
                        alt={safeHaven.contact_name}
                        fill
                        className="rounded-full object-cover border-4 border-theme-purple/10"
                        sizes="(max-width: 640px) 96px, (max-width: 1024px) 112px, 128px"
                        loading="lazy"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/img/avatar-placeholder.svg';
                        }}
                    />
                </div>
            ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded-full bg-gradient-theme flex items-center justify-center mx-auto mb-4 border-4 border-theme-purple/10">
                    <span className="text-3xl sm:text-4xl text-white font-bold">
                        {safeHaven.contact_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                </div>
            )}

            {/* Badge */}
            <div className="text-center mb-3">
                <span className="inline-block px-3 py-1.5 bg-slate-600 dark:bg-slate-700 text-white text-xs sm:text-sm font-semibold rounded-full shadow-sm">
                    Safe Haven
                </span>
            </div>

            {/* Name */}
            <h3 className="text-xl sm:text-2xl font-bold text-theme text-center mb-4 px-2 break-words">
                {safeHaven.contact_name}
            </h3>

            {/* Availability Today (computed from weekly JSON when present, else legacy fields) */}
            {(() => {
                const dayNameMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const todayName = dayNameMap[new Date().getDay()];
                const week = (safeHaven as any).availability_week as any[] | undefined;
                const todayEntry = week ? week.find(w => w.day === todayName) : undefined;
                const isAvailableToday = todayEntry ? !!todayEntry.isAvailable : !!safeHaven.is_available_today;
                const todaysSlots = todayEntry ? (todayEntry.timeSlots || []) : (safeHaven.availability_times || []);

                if (isAvailableToday && todaysSlots && todaysSlots.length > 0) {
                    return (
                        <div className="mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                                    Vandaag beschikbaar
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                {todaysSlots.map((slot: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                        <span className="text-xs font-medium">
                                            {formatTime(slot.start)} - {formatTime(slot.end)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                }

                // Not available today
                return (
                    <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-white/5 p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="h-2 w-2 rounded-full bg-gray-400" />
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                Vandaag niet beschikbaar
                            </p>
                        </div>
                    </div>
                );
            })()}

            {/* Contact Info */}
            {(safeHaven.email || safeHaven.phone_number) && (
                <div className="pt-4 space-y-3 border-t border-theme-purple/10">
                    {/* Email */}
                    {safeHaven.email && (
                        <a
                            href={`mailto:${safeHaven.email}`}
                            className="flex items-center justify-start gap-3 text-theme-muted hover:text-slate-600 dark:hover:text-slate-400 transition-colors group px-2"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-all">
                                <Mail className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium break-all min-w-0 flex-1 text-left">{safeHaven.email}</span>
                        </a>
                    )}

                    {/* Phone */}
                    {safeHaven.phone_number && (
                        <a
                            href={`tel:${safeHaven.phone_number}`}
                            className="flex items-center justify-start gap-3 text-theme-muted hover:text-slate-600 dark:hover:text-slate-400 transition-colors group px-2"
                        >
                            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-600 flex items-center justify-center flex-shrink-0 transition-all">
                                <Phone className="w-4 h-4 sm:w-5 sm:h-5 group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-xs sm:text-sm font-medium">{safeHaven.phone_number}</span>
                        </a>
                    )}
                </div>
            )}
        </div>
    );
};

export default SafeHavenCard;
