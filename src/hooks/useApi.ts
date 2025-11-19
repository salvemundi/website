import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query';
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
  siteSettingsApi
} from '../lib/api';
import { Event, Committee, Member, Board, Club, Job, Sponsor, SafeHaven, SiteSettings } from '../types';

// Events (Activities) Hooks
export function useEvents(options?: UseQueryOptions<Event[]>) {
  return useQuery({
    queryKey: ['events'],
    queryFn: eventsApi.getAll,
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useEvent(id: string, options?: UseQueryOptions<Event>) {
  return useQuery({
    queryKey: ['events', id],
    queryFn: () => eventsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useEventsByCommittee(committeeId: number | undefined) {
  return useQuery({
    queryKey: ['events', 'committee', committeeId],
    queryFn: () => eventsApi.getByCommittee(committeeId!),
    enabled: !!committeeId,
    staleTime: 5 * 60 * 1000
  });
}

// Committees Hooks
export function useCommittees(options?: UseQueryOptions<Committee[]>) {
  return useQuery({
    queryKey: ['committees'],
    queryFn: committeesApi.getAll,
    staleTime: 5 * 60 * 1000,
    ...options
  });
}

export function useCommittee(id: number | undefined) {
  return useQuery({
    queryKey: ['committees', id],
    queryFn: () => committeesApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
}

// Members Hooks
export function useMembers() {
  return useQuery({
    queryKey: ['members'],
    queryFn: membersApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

export function useMember(id: number | undefined) {
  return useQuery({
    queryKey: ['members', id],
    queryFn: () => membersApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
}

// Board Hooks
export function useBoard() {
  return useQuery({
    queryKey: ['board'],
    queryFn: boardApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

// Clubs Hooks
export function useClubs() {
  return useQuery({
    queryKey: ['clubs'],
    queryFn: clubsApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

export function useClub(id: number | undefined) {
  return useQuery({
    queryKey: ['clubs', id],
    queryFn: () => clubsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
}

// Pub Crawl Hooks
export function usePubCrawlEvents() {
  return useQuery({
    queryKey: ['pubCrawlEvents'],
    queryFn: pubCrawlEventsApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

// Sponsors Hook
export function useSponsors() {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: sponsorsApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

// Jobs Hooks
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

export function useJob(id: number | undefined) {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => jobsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000
  });
}

// Safe Havens Hook
export function useSafeHavens() {
  return useQuery({
    queryKey: ['safeHavens'],
    queryFn: safeHavensApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

// Stickers Hook
export function useStickers() {
  return useQuery({
    queryKey: ['stickers'],
    queryFn: stickersApi.getAll,
    staleTime: 5 * 60 * 1000
  });
}

// Site Settings Hook
export function useSiteSettings(options?: UseQueryOptions<SiteSettings | null>) {
  return useQuery({
    queryKey: ['siteSettings'],
    queryFn: siteSettingsApi.get,
    staleTime: 5 * 60 * 1000,
    ...options
  });
}
