import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { eventsApi } from '../api/activities';
import { committeesApi } from '../api/committees';
import { membersApi } from '../api/members';
import { boardApi } from '../api/board';
import { clubsApi } from '../api/clubs';
import { pubCrawlEventsApi } from '../api/pub-crawl';
import { sponsorsApi } from '../api/sponsors';
import { jobsApi } from '../api/jobs';
import { safeHavensApi } from '../api/safe-haven';
import { stickersApi } from '../api/stickers';
import { transactionsApi } from '../api/transactions';
import { whatsappGroupsApi } from '../api/whatsapp';
import { siteSettingsApi } from '../api/site-settings';
import {
    tripsApi,
    tripActivitiesApi,
    tripSignupsApi
} from '../api/trips';

import type {
    Trip,
    TripActivity
} from '../api/types';

// Events (Activities) Hooks
export function useSalvemundiEvents(options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['events'],
        queryFn: eventsApi.getAll,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiEvent(id: string, options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>) {
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
export function useSalvemundiCommittees(options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['committees'],
        queryFn: committeesApi.getAll,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiCommitteesWithMembers(options?: Omit<UseQueryOptions<any[]>, 'queryKey' | 'queryFn'>) {
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
        queryKey: ['pub-crawl', 'events'],
        queryFn: pubCrawlEventsApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

export function useSalvemundiPubCrawlEvent(id: number | string | undefined) {
    return useQuery({
        queryKey: ['pub-crawl', 'events', id],
        queryFn: () => pubCrawlEventsApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000
    });
}

// Sponsors Hooks
export function useSalvemundiSponsors() {
    return useQuery({
        queryKey: ['sponsors'],
        queryFn: sponsorsApi.getAll,
        staleTime: 10 * 60 * 1000
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

// Safe Havens Hooks
export function useSalvemundiSafeHavens() {
    return useQuery({
        queryKey: ['safe-havens'],
        queryFn: safeHavensApi.getAll,
        staleTime: 10 * 60 * 1000
    });
}

// Stickers Hooks
export function useSalvemundiStickers() {
    return useQuery({
        queryKey: ['stickers'],
        queryFn: stickersApi.getAll,
        staleTime: 5 * 60 * 1000
    });
}

// Transactions Hooks
export function useSalvemundiTransactions(userId: string | undefined) {
    return useQuery({
        queryKey: ['transactions', userId],
        queryFn: () => transactionsApi.getAll(userId!),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000
    });
}

// Whatsapp Groups Hooks
export function useSalvemundiWhatsappGroups(memberOnly: boolean = false) {
    return useQuery({
        queryKey: ['whatsapp-groups', memberOnly],
        queryFn: () => whatsappGroupsApi.getAll(memberOnly),
        staleTime: 10 * 60 * 1000
    });
}

// Site Settings Hooks
export function useSalvemundiSiteSettings(page?: string) {
    return useQuery({
        queryKey: ['site-settings', page],
        queryFn: () => siteSettingsApi.get(page),
        staleTime: 5 * 60 * 1000
    });
}

// Trip Hooks
export function useSalvemundiTrips(options?: Omit<UseQueryOptions<Trip[]>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['trips'],
        queryFn: tripsApi.getAll,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiTrip(id: number | undefined, options?: Omit<UseQueryOptions<Trip>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['trips', id],
        queryFn: () => tripsApi.getById(id!),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}

export function useSalvemundiTripActivities(tripId: number | undefined, options?: Omit<UseQueryOptions<TripActivity[]>, 'queryKey' | 'queryFn'>) {
    return useQuery({
        queryKey: ['trip-activities', tripId],
        queryFn: () => tripActivitiesApi.getByTripId(tripId!),
        enabled: !!tripId,
        staleTime: 5 * 60 * 1000,
        ...options
    });
}



export function useTripParticipantsCount(tripId: number | undefined) {
    return useQuery({
        queryKey: ['trip-participants-count', tripId],
        queryFn: () => tripSignupsApi.getParticipantsCount(tripId!),
        enabled: !!tripId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useMyTripSignup(tripId: number | undefined) {
    return useQuery({
        queryKey: ['my-trip-signup', tripId],
        queryFn: () => tripSignupsApi.getMySignup(tripId!),
        enabled: !!tripId,
        staleTime: 0, // Always fetch fresh to ensure status is up to date
    });
}
