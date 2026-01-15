import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import {
    eventsApi,
    committeesApi,
    membersApi,
    boardApi,
    clubsApi,
    pubCrawlEventsApi,
    sponsorsApi,
    jobsApi,
    safeHavensApi,
    stickersApi,
    transactionsApi,
    whatsappGroupsApi,
    siteSettingsApi,
    SiteSettings,
    tripsApi,
    tripActivitiesApi,
    tripSignupsApi,
    Trip,
    TripActivity,
    TripSignup
} from '@/shared/lib/api/salvemundi';

// Events (Activities) Hooks
export function useSalvemundiEvents(options?: UseQueryOptions<any[]>) {
    return useQuery({
        queryKey: ['events'],
        queryFn: eventsApi.getAll,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiEvent(id: string, options?: UseQueryOptions<any>) {
    return useQuery({
        queryKey: ['events', id],
        queryFn: () => eventsApi.getById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiEventsByCommittee(committeeId: number | undefined) {
    return useQuery({
        queryKey: ['events', 'committee', committeeId],
        queryFn: () => eventsApi.getByCommittee(committeeId!),
        enabled: !!committeeId,
        staleTime: 5 * 60 * 1000
    });
}

// Committees Hooks
export function useSalvemundiCommittees(options?: UseQueryOptions<any[]>) {
    return useQuery({
        queryKey: ['committees'],
        queryFn: committeesApi.getAll,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiCommitteesWithMembers(options?: UseQueryOptions<any[]>) {
    return useQuery({
        queryKey: ['committees', 'with-members'],
        queryFn: committeesApi.getAllWithMembers,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiCommittee(id: number | undefined) {
    return useQuery({
        queryKey: ['committees', id],
        queryFn: () => committeesApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// Members Hooks
export function useSalvemundiMembers() {
    return useQuery({
        queryKey: ['members'],
        queryFn: membersApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

export function useSalvemundiMember(id: number | undefined) {
    return useQuery({
        queryKey: ['members', id],
        queryFn: () => membersApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// Board Hooks
export function useSalvemundiBoard() {
    return useQuery({
        queryKey: ['board'],
        queryFn: boardApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Clubs Hooks
export function useSalvemundiClubs() {
    return useQuery({
        queryKey: ['clubs'],
        queryFn: clubsApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

export function useSalvemundiClub(id: number | undefined) {
    return useQuery({
        queryKey: ['clubs', id],
        queryFn: () => clubsApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// Pub Crawl Hooks
export function useSalvemundiPubCrawlEvents() {
    return useQuery({
        queryKey: ['pubCrawlEvents'],
        queryFn: pubCrawlEventsApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Sponsors Hook
export function useSalvemundiSponsors() {
    return useQuery({
        queryKey: ['sponsors'],
        queryFn: sponsorsApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Jobs Hooks
export function useSalvemundiJobs() {
    return useQuery({
        queryKey: ['jobs'],
        queryFn: jobsApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

export function useSalvemundiJob(id: number | undefined) {
    return useQuery({
        queryKey: ['jobs', id],
        queryFn: () => jobsApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// Safe Havens Hook
export function useSalvemundiSafeHavens() {
    return useQuery({
        queryKey: ['safeHavens'],
        queryFn: safeHavensApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Stickers Hook
export function useSalvemundiStickers() {
    return useQuery({
        queryKey: ['stickers'],
        queryFn: stickersApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Transactions Hook
export function useSalvemundiTransactions(userId: string | undefined) {
    return useQuery({
        queryKey: ['transactions', userId],
        queryFn: () => transactionsApi.getAll(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000
    });
}

// WhatsApp Groups Hook
export function useSalvemundiWhatsAppGroups(memberOnly: boolean = false) {
    return useQuery({
        queryKey: ['whatsapp_groups', memberOnly],
        queryFn: () => whatsappGroupsApi.getAll(memberOnly),
        staleTime: 5 * 60 * 1000
    });
}

// Site Settings Hook
export function useSalvemundiSiteSettings(page?: string, options?: UseQueryOptions<SiteSettings | null>) {
    return useQuery({
        queryKey: page ? ['siteSettings', page] : ['siteSettings'],
        queryFn: () => siteSettingsApi.get(page),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

// Trip Hooks
export function useSalvemundiTrips(options?: UseQueryOptions<Trip[]>) {
    return useQuery({
        queryKey: ['trips'],
        queryFn: () => tripsApi.getAll(),
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiTrip(id: number | undefined, options?: UseQueryOptions<Trip>) {
    return useQuery({
        queryKey: ['trips', id],
        queryFn: () => tripsApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiTripActivities(tripId: number | undefined, options?: UseQueryOptions<TripActivity[]>) {
    return useQuery({
        queryKey: ['trip_activities', tripId],
        queryFn: () => tripActivitiesApi.getByTripId(tripId!),
        enabled: !!tripId,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiTripSignups(tripId: number | undefined, options?: UseQueryOptions<TripSignup[]>) {
    return useQuery({
        queryKey: ['trip_signups', tripId],
        queryFn: () => tripSignupsApi.getByTripId(tripId!),
        enabled: !!tripId,
        staleTime: 1 * 60 * 1000, // 1 minute for more frequent updates
        ...options
    });
}
