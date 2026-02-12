import { getEvents } from "@/shared/api/salvemundi-server";
import { Suspense } from 'react';
import ActivitiesContent from "./ActivitiesContent";

export default async function ActivitiesPage() {
    const initialEvents = await getEvents();

    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-paars text-xl font-semibold">Laden...</div>
            </div>
        }>
            <ActivitiesContent initialEvents={initialEvents} />
        </Suspense>
    );
}
