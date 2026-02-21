'use client';

import { useState } from 'react';
import CalendarView from '@/entities/activity/ui/CalendarView';
import DayDetails from '@/entities/activity/ui/DayDetails';
import EventList from '@/entities/activity/ui/EventList';
import { useRouter } from 'next/navigation';
import { addMonths, subMonths } from 'date-fns';

export default function CalendarIsland({ events }: { events: any[] }) {
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());

    const handleShowDetails = (activity: any) => {
        router.push(`/activiteiten/${activity.id}`);
    };

    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {selectedDay && (
                <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                    <DayDetails
                        selectedDay={selectedDay}
                        events={events}
                        onClose={() => setSelectedDay(null)}
                        onEventClick={handleShowDetails}
                    />
                </aside>
            )}

            <div className="flex-1 space-y-6">
                <div className="hidden lg:block">
                    <CalendarView
                        currentDate={currentDate}
                        events={events}
                        selectedDay={selectedDay}
                        onSelectDay={setSelectedDay}
                        onEventClick={handleShowDetails}
                        onPrevMonth={() => setCurrentDate(subMonths(currentDate, 1))}
                        onNextMonth={() => setCurrentDate(addMonths(currentDate, 1))}
                        onGoToDate={(d: Date) => setCurrentDate(d)}
                    />
                </div>
                <div className="lg:hidden">
                    <EventList
                        events={events}
                        onEventClick={handleShowDetails}
                    />
                </div>
            </div>
        </div>
    );
}
