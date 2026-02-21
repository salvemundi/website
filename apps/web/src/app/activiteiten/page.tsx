import { getEvents } from "@/shared/api/salvemundi-server";
import PageHeader from "@/widgets/page-header/ui/PageHeader";
import FlipClock from "@/shared/ui/FlipClock";
import ActivitiesFilters from "./ActivitiesFilters";
import CalendarIsland from "./CalendarIsland";
import { EventListIsland, FeaturedEventIsland } from "./ActivityIslands";
import { PaymentStatusHandler } from "./PaymentStatusHandler";

// Use Promise type for Next.js 15 searchParams
export default async function ActivitiesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedSearchParams = await searchParams;
    const view = typeof resolvedSearchParams.view === 'string' ? resolvedSearchParams.view : 'list';
    const showPast = resolvedSearchParams.past === 'true';

    const events = await getEvents();
    const now = new Date();

    let filteredEvents = events;

    if (!showPast) {
        filteredEvents = filteredEvents.filter(event => {
            const eventDateTime = event.event_time
                ? new Date(`${event.event_date}T${event.event_time}`)
                : new Date(event.event_date);
            return eventDateTime >= now;
        });
    }

    // Sort events
    filteredEvents.sort((a, b) => {
        const aDateTime = a.event_time
            ? new Date(`${a.event_date}T${a.event_time}`).getTime()
            : new Date(a.event_date).getTime();
        const bDateTime = b.event_time
            ? new Date(`${b.event_date}T${b.event_time}`).getTime()
            : new Date(b.event_date).getTime();
        return aDateTime - bDateTime;
    });

    // Upcoming Event logic
    const upcomingEvent = events
        .filter(e => {
            const eventDateTime = e.event_time
                ? new Date(`${e.event_date}T${e.event_time}`)
                : new Date(e.event_date);
            return eventDateTime >= now;
        })
        .sort((a, b) => {
            const aDateTime = a.event_time
                ? new Date(`${a.event_date}T${a.event_time}`).getTime()
                : new Date(a.event_date).getTime();
            const bDateTime = b.event_time
                ? new Date(`${b.event_date}T${b.event_time}`).getTime()
                : new Date(b.event_date).getTime();
            return aDateTime - bDateTime;
        })[0];

    return (
        <div className="">
            <PaymentStatusHandler />
            <PageHeader
                title="ACTIVITEITEN"
                backgroundImage="/img/backgrounds/activity-banner.jpg"
                backgroundPosition="center 75%"
                variant="centered"
                titleClassName="text-theme-purple dark:text-theme-white text-3xl sm:text-4xl md:text-6xl drop-shadow-sm"
                description={
                    <p className="mx-auto text-center text-lg sm:text-xl text-theme-purple dark:text-theme-white max-w-3xl mt-4 font-medium drop-shadow-sm">
                        Bekijk alle evenementen, trainingen en feesten van Salve Mundi.
                    </p>
                }
                overlayClassName="bg-black/60 backdrop-blur-md"
            >
                {upcomingEvent && (
                    <div className="px-8 pb-4">
                        <FlipClock
                            targetDate={upcomingEvent.event_time
                                ? `${upcomingEvent.event_date}T${upcomingEvent.event_time}`
                                : upcomingEvent.event_date
                            }
                            title={upcomingEvent.name}
                            href={`/activiteiten/${upcomingEvent.id}`}
                        />
                    </div>
                )}
            </PageHeader>
            <main className="w-full px-4 py-8 sm:py-10 md:py-12">
                <div className="relative w-full flex flex-col">
                    <ActivitiesFilters />

                    {view === 'calendar' ? (
                        <CalendarIsland events={filteredEvents} />
                    ) : (
                        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
                            {upcomingEvent && !showPast && (
                                <aside className="lg:w-96 xl:w-[28rem] space-y-6">
                                    <FeaturedEventIsland event={upcomingEvent} />
                                </aside>
                            )}
                            <div className="flex-1 space-y-6 items-start">
                                <EventListIsland
                                    events={filteredEvents}
                                    variant={view === 'grid' ? 'grid' : 'list'}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
