'use client';

import { useState, useEffect } from 'react';
import HeroBanner from '@/components/HeroBanner';
import { introPlanningApi } from '@/shared/lib/api/salvemundi';
import { useQuery } from '@tanstack/react-query';
import { format, parse } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Calendar, Clock, X, Info } from 'lucide-react';

export default function IntroPlanningPage() {
    const [selectedEvent, setSelectedEvent] = useState<any>(null);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    // Fetch intro planning
    const { data: introPlanning, isLoading } = useQuery({
        queryKey: ['intro-planning'],
        queryFn: introPlanningApi.getAll,
    });

    // Define the order of days
    const dayOrder = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'];

    // Generate hours from 9:00 to 23:00
    const hours = Array.from({ length: 15 }, (_, i) => i + 9); // 9 to 23

    const groupPlanningByDay = () => {
        if (!introPlanning) return {};
        const grouped = introPlanning.reduce((acc, item) => {
            if (!acc[item.day]) {
                acc[item.day] = [];
            }
            acc[item.day].push(item);
            return acc;
        }, {} as Record<string, typeof introPlanning>);

        // grouped planning computed

        // Sort by day order
        return Object.keys(grouped)
            .sort((a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b))
            .reduce((acc, day) => {
                acc[day] = grouped[day];
                return acc;
            }, {} as Record<string, typeof introPlanning>);
    };

    const planningByDay = groupPlanningByDay();
    const days = Object.keys(planningByDay);

    // days and item counts computed

    // Set first day as default if not selected and we're not showing all days
    useEffect(() => {
        if (selectedDay === null && days.length > 0) {
            // Don't auto-select, start with all days visible
        }
    }, [days.length, selectedDay]);

    // Filter days based on selection (show all on desktop by default, selected on mobile)
    const displayDays = selectedDay ? [selectedDay] : days;

    // Helper to calculate event position and height
    const getEventPosition = (timeStart: string, timeEnd?: string) => {
        try {
            // Parse time with seconds (HH:mm:ss format from Directus)
            const startTime = parse(timeStart, 'HH:mm:ss', new Date());
            const startHour = startTime.getHours();
            const startMinute = startTime.getMinutes();

            // Calculate top position (offset from 9:00)
            const top = ((startHour - 9) * 60 + startMinute);

            // Calculate height
            let height = 60; // Default 1 hour
            if (timeEnd) {
                const endTime = parse(timeEnd, 'HH:mm:ss', new Date());
                const endHour = endTime.getHours();
                const endMinute = endTime.getMinutes();
                height = ((endHour - 9) * 60 + endMinute) - top;
            }

            return { top, height: Math.max(height, 30) }; // Minimum 30px height
        } catch (e) {
            return { top: 0, height: 60 };
        }
    };

    // Normalize Directus icon field and map to Material Symbols name
    const normalizeToMaterial = (iconField: any): string => {
        if (!iconField) return 'place'; // default material icon
        let raw: string | undefined;
        if (typeof iconField === 'string') raw = iconField;
        else if (typeof iconField === 'object') raw = iconField.name || iconField.value || iconField.icon || iconField.id;
        if (!raw) return 'place';

        // Remove common prefixes like 'mdi:' and convert kebab_case to material name
        raw = raw.replace(/^mdi:/, '').trim();

        // Map some common names to material equivalents
        const map: Record<string, string> = {
            'map-pin': 'place',
            'map_pin': 'place',
            'map': 'place',
            'clock': 'schedule',
            'users': 'group',
            'coffee': 'local_cafe',
            'music': 'music_note',
            'activity': 'sports_score',
            'calendar': 'event',
        };

        const key = raw.toLowerCase();
        return map[key] || key.replace(/[-_\s]+/g, '_');
    };

    // Auto-assign colors to events for better readability
    // Uses a diverse color palette with good contrast
    const getEventColor = (dayIndex: number, eventIndex: number): string => {
        const colorPalettes = [
            // Palette for maximum contrast and readability
            ['from-blue-500 to-blue-600', 'hover:from-blue-600 hover:to-blue-700'],
            ['from-purple-500 to-purple-600', 'hover:from-purple-600 hover:to-purple-700'],
            ['from-pink-500 to-pink-600', 'hover:from-pink-600 hover:to-pink-700'],
            ['from-indigo-500 to-indigo-600', 'hover:from-indigo-600 hover:to-indigo-700'],
            ['from-teal-500 to-teal-600', 'hover:from-teal-600 hover:to-teal-700'],
            ['from-cyan-500 to-cyan-600', 'hover:from-cyan-600 hover:to-cyan-700'],
            ['from-violet-500 to-violet-600', 'hover:from-violet-600 hover:to-violet-700'],
            ['from-fuchsia-500 to-fuchsia-600', 'hover:from-fuchsia-600 hover:to-fuchsia-700'],
        ];

        // Use a combination of day and event index to distribute colors
        const colorIndex = (dayIndex * 3 + eventIndex) % colorPalettes.length;
        return colorPalettes[colorIndex].join(' ');
    };

    return (
        <>
            <main className="px-4 sm:px-6 lg:px-10 py-8 lg:py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Hero Banner */}
                    <HeroBanner
                        title="Intro Week Planning"
                        subtitle="Bekijk het volledige programma en mis geen enkel onderdeel van de introweek"
                        image={{
                            src: "/img/backgrounds/intro-banner.jpg",
                            alt: "Intro Banner",
                            priority: true
                        }}
                        cta={{
                            label: "Meld je aan voor de intro",
                            href: "/intro",
                            variant: "primary"
                        }}
                    />
                    <div className="text-center mb-8 lg:mb-10">
                        <div className="inline-flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 lg:w-6 lg:h-6 text-theme-purple" />
                            <h2 className="text-2xl lg:text-3xl font-bold text-gradient">Planning van de Week</h2>
                        </div>
                        <p className="text-theme-muted text-base lg:text-lg mb-6">
                            Bekijk wat er allemaal op het programma staat
                        </p>

                        {/* Day Selector - Desktop: Buttons, Mobile: Dropdown */}
                        {days.length > 0 && (
                            <>
                                {/* Desktop Day Selector */}
                                <div className="hidden md:flex flex-wrap gap-2 justify-center">
                                    <button
                                        onClick={() => setSelectedDay(null)}
                                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${selectedDay === null
                                            ? 'bg-gradient-theme text-white shadow-lg'
                                            : 'bg-theme-purple/10 text-theme hover:bg-theme-purple/20'
                                            }`}
                                    >
                                        Alle dagen
                                    </button>
                                    {days.map((day) => {
                                        const items = planningByDay[day];
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDay(day)}
                                                className={`px-4 py-2 rounded-full font-semibold text-sm transition-all ${selectedDay === day
                                                    ? 'bg-gradient-theme text-white shadow-lg'
                                                    : 'bg-theme-purple/10 text-theme hover:bg-theme-purple/20'
                                                    }`}
                                            >
                                                {day}
                                                {items[0]?.date && (
                                                    <span className="ml-1 text-xs opacity-80">
                                                        ({format(new Date(items[0].date), 'd/M', { locale: nl })})
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Mobile Day Selector - Dropdown */}
                                <div className="md:hidden">
                                    <select
                                        value={selectedDay || ''}
                                        onChange={(e) => setSelectedDay(e.target.value || null)}
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border-2 border-theme-purple/20 text-theme font-semibold focus:border-theme-purple focus:outline-none"
                                    >
                                        <option value="">Alle dagen</option>
                                        {days.map((day) => {
                                            const items = planningByDay[day];
                                            return (
                                                <option key={day} value={day}>
                                                    {day}
                                                    {items[0]?.date && ` - ${format(new Date(items[0].date), 'd/M', { locale: nl })}`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-theme-purple"></div>
                            <p className="text-theme-muted mt-4">Planning laden...</p>
                        </div>
                    ) : !introPlanning || introPlanning.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="w-16 h-16 text-theme-purple/30 mx-auto mb-4" />
                            <p className="text-theme-muted text-lg">
                                De planning is nog niet beschikbaar. Check later terug!
                            </p>
                        </div>
                    ) : (
                        <div className="bg-[var(--bg-card)] rounded-2xl shadow-lg overflow-hidden">
                            {/* Weekly Calendar Grid */}
                            <div className="overflow-x-auto">
                                <div className="min-w-full" style={{ minWidth: displayDays.length === 1 ? '100%' : '800px' }}>
                                    {/* Header with days */}
                                    <div className="grid gap-0 border-b-2 border-theme-purple/20 sticky top-0 bg-[var(--bg-card)] z-20"
                                        style={{ gridTemplateColumns: displayDays.length === 1 ? '60px 1fr' : `60px repeat(${displayDays.length}, 1fr)` }}>
                                        <div className="p-2 lg:p-3 font-bold text-theme border-r border-theme-purple/10 text-xs lg:text-sm flex items-center justify-center">
                                            Tijd
                                        </div>
                                        {displayDays.map((day) => {
                                            const items = planningByDay[day];
                                            return (
                                                <div
                                                    key={day}
                                                    className="p-2 lg:p-3 text-center border-r border-theme-purple/10 last:border-r-0"
                                                >
                                                    <div className="font-bold text-theme-purple text-sm lg:text-base">
                                                        {day}
                                                    </div>
                                                    {items[0]?.date && (
                                                        <div className="text-[10px] lg:text-xs text-theme-muted mt-0.5">
                                                            {format(new Date(items[0].date), 'd MMM', { locale: nl })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Time grid - Scrollable */}
                                    <div className="relative" style={{ height: 'auto', maxHeight: 'calc(100vh - 350px)', minHeight: '500px' }}>
                                        {/* Hour rows */}
                                        {hours.map((hour) => (
                                            <div
                                                key={hour}
                                                className="grid gap-0 border-b border-theme-purple/10"
                                                style={{
                                                    gridTemplateColumns: displayDays.length === 1 ? '60px 1fr' : `60px repeat(${displayDays.length}, 1fr)`,
                                                    height: '60px'
                                                }}
                                            >
                                                <div className="p-1.5 lg:p-2 text-[10px] lg:text-xs text-theme-muted font-semibold border-r border-theme-purple/10 flex items-start justify-center">
                                                    {`${hour}:00`}
                                                </div>
                                                {displayDays.map((day) => (
                                                    <div
                                                        key={`${day}-${hour}`}
                                                        className="border-r border-theme-purple/10 last:border-r-0 relative bg-theme-purple/[0.02]"
                                                    />
                                                ))}
                                            </div>
                                        ))}

                                        {/* Events overlay */}
                                        <div className="absolute inset-0 grid gap-0 pointer-events-none"
                                            style={{ gridTemplateColumns: displayDays.length === 1 ? '60px 1fr' : `60px repeat(${displayDays.length}, 1fr)` }}>
                                            <div /> {/* Skip time column */}
                                            {displayDays.map((day, dayIndex) => {
                                                const items = planningByDay[day];
                                                // rendering day
                                                return (
                                                    <div key={day} className="relative pointer-events-auto">
                                                        {items.map((item, eventIndex) => {
                                                            const { top, height } = getEventPosition(item.time_start, item.time_end);
                                                            const colorClasses = getEventColor(dayIndex, eventIndex);
                                                            // event position calculated

                                                            return (
                                                                <button
                                                                    key={item.id}
                                                                    onClick={() => setSelectedEvent(item)}
                                                                    className={`absolute left-0.5 right-0.5 lg:left-1 lg:right-1 rounded-md lg:rounded-lg p-1.5 lg:p-2 shadow-md overflow-hidden group hover:z-10 hover:shadow-xl transition-all cursor-pointer bg-gradient-to-br text-white ${colorClasses}`}
                                                                    style={{
                                                                        top: `${top}px`,
                                                                        height: `${Math.max(height, 30)}px`,
                                                                    }}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <div className="p-1 rounded bg-white/10 flex items-center justify-center">
                                                                            <span
                                                                                className="material-symbols-outlined text-white text-[14px] leading-none"
                                                                                style={{ fontFamily: '"Material Symbols Outlined"', fontVariationSettings: `"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48` }}
                                                                            >
                                                                                {normalizeToMaterial(item.icon)}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-[10px] lg:text-xs font-bold truncate">{item.title}</div>
                                                                    </div>
                                                                    <div className="text-[8px] lg:text-[10px] opacity-90 flex items-center gap-0.5">
                                                                        <Clock className="w-2 h-2 lg:w-3 lg:h-3 flex-shrink-0" />
                                                                        <span className="truncate">{item.time_start}</span>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* Event Detail Modal */}
            {selectedEvent && (
                <div
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setSelectedEvent(null)}
                >
                    <div
                        className="bg-[var(--bg-card)] rounded-3xl max-w-2xl w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setSelectedEvent(null)}
                            className="sticky top-4 float-right m-4 p-2 rounded-full bg-theme-purple/20 hover:bg-theme-purple/30 transition-colors z-10"
                            aria-label="Close"
                        >
                            <X className="w-6 h-6 text-theme-purple" />
                        </button>

                        <div className="p-6 lg:p-8">
                            <div className="flex items-start gap-3 mb-6">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
                                    <span
                                        className="material-symbols-outlined text-white"
                                        style={{ fontFamily: '"Material Symbols Outlined"', fontVariationSettings: `"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48` }}
                                    >{normalizeToMaterial(selectedEvent.icon)}</span>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl lg:text-3xl font-bold text-gradient mb-2">
                                        {selectedEvent.title}
                                    </h2>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div className="flex items-center gap-3 text-theme">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-theme-purple/10">
                                        <Clock className="w-5 h-5 text-theme-purple" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-theme-muted">Tijd</div>
                                        <div className="font-semibold">
                                            {selectedEvent.time_start}
                                            {selectedEvent.time_end && ` - ${selectedEvent.time_end}`}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 text-theme">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-theme-purple/10">
                                        <Calendar className="w-5 h-5 text-theme-purple" />
                                    </div>
                                    <div>
                                        <div className="text-sm text-theme-muted">Dag</div>
                                        <div className="font-semibold">
                                            {selectedEvent.day}
                                            {selectedEvent.date && ` - ${format(new Date(selectedEvent.date), 'd MMMM yyyy', { locale: nl })}`}
                                        </div>
                                    </div>
                                </div>

                                {selectedEvent.location && (
                                    <div className="flex items-center gap-3 text-theme">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-theme-purple/10">
                                            <span
                                                className="material-symbols-outlined text-theme-purple"
                                                style={{ fontFamily: '"Material Symbols Outlined"', fontVariationSettings: `"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 48` }}
                                            >{normalizeToMaterial(selectedEvent.icon)}</span>
                                        </div>
                                        <div>
                                            <div className="text-sm text-theme-muted">Locatie</div>
                                            <div className="font-semibold">{selectedEvent.location}</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {selectedEvent.description && (
                                <div className="bg-theme-purple/5 rounded-xl p-4 lg:p-6">
                                    <h3 className="font-bold text-theme mb-2 flex items-center gap-2">
                                        <Info className="w-5 h-5 text-theme-purple" />
                                        Beschrijving
                                    </h3>
                                    <p className="text-theme-muted leading-relaxed">
                                        {selectedEvent.description}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </>
    );
}
