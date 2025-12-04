import { create } from 'zustand';
import { eventsApi, clubsApi, committeesApi, sponsorsApi } from '../api/salvemundi';
import { MOCK_EVENTS, MOCK_COMMITTEES, MOCK_CLUBS } from '../mockData';

interface Event {
    id: number | string;
    name: string;
    event_date: string;
    description?: string;
    description_logged_in?: string;
    price_members?: number;
    price_non_members?: number;
    max_sign_ups?: number;
    only_members?: boolean;
    image?: string;
    committee_id?: number;
    committee_name?: string;
    contact?: string;
    contact_name?: string;
}

interface Committee {
    id: number;
    name: string;
    image?: any;
    is_visible?: boolean;
    short_description?: string;
    description?: string;
    committee_members?: any[];
    created_at?: string;
    updated_at?: string;
}

interface Club {
    id: number;
    name: string;
    description?: string;
    image?: string;
    whatsapp_link?: string;
    discord_link?: string;
    website_link?: string;
    created_at?: string;
}

interface Sponsor {
    sponsor_id: number;
    image?: string;
    website_url?: string;
}

interface DirectusStore {
    // Events
    events: Event[];
    eventsLoading: boolean;
    eventsError: string | null;
    loadEvents: () => Promise<void>;

    // Committees
    committees: Committee[];
    committeesLoading: boolean;
    committeesError: string | null;
    loadCommittees: () => Promise<void>;

    // Clubs
    clubs: Club[];
    clubsLoading: boolean;
    clubsError: string | null;
    loadClubs: () => Promise<void>;

    // Sponsors
    sponsors: Sponsor[];
    sponsorsLoading: boolean;
    sponsorsError: string | null;
    loadSponsors: () => Promise<void>;

    // Hero Banners
    heroBanners: any[]; // Using any to avoid circular dependency issues for now, or import type if possible
    heroBannersLoading: boolean;
    heroBannersError: string | null;
    loadHeroBanners: () => Promise<void>;
}

export const useDirectusStore = create<DirectusStore>((set) => ({
    // Events
    events: [],
    eventsLoading: false,
    eventsError: null,
    loadEvents: async () => {
        set({ eventsLoading: true, eventsError: null });
        try {
            const data = await eventsApi.getAll();
            set({ events: data, eventsLoading: false });
        } catch (error) {
            console.error('Failed to load events, using mock data:', error);
            set({
                events: MOCK_EVENTS as Event[],
                eventsLoading: false,
                // We don't set error here so the UI shows the mock data
            });
        }
    },

    // Committees
    committees: [],
    committeesLoading: false,
    committeesError: null,
    loadCommittees: async () => {
        set({ committeesLoading: true, committeesError: null });
        try {
            const data = await committeesApi.getAllWithMembers();
            set({ committees: data, committeesLoading: false });
        } catch (error) {
            console.error('Failed to load committees, using mock data:', error);
            set({
                committees: MOCK_COMMITTEES as Committee[],
                committeesLoading: false,
            });
        }
    },

    // Clubs
    clubs: [],
    clubsLoading: false,
    clubsError: null,
    loadClubs: async () => {
        set({ clubsLoading: true, clubsError: null });
        try {
            const data = await clubsApi.getAll();
            set({ clubs: data, clubsLoading: false });
        } catch (error) {
            console.error('Failed to load clubs, using mock data:', error);
            set({
                clubs: MOCK_CLUBS as Club[],
                clubsLoading: false,
            });
        }
    },

    // Sponsors
    sponsors: [],
    sponsorsLoading: false,
    sponsorsError: null,
    loadSponsors: async () => {
        set({ sponsorsLoading: true, sponsorsError: null });
        try {
            const data = await sponsorsApi.getAll();
            set({ sponsors: data, sponsorsLoading: false });
        } catch (error) {
            console.error('Failed to load sponsors:', error);
            set({
                sponsorsError: error instanceof Error ? error.message : 'Failed to load sponsors',
                sponsorsLoading: false,
            });
        }
    },

    // Hero Banners
    heroBanners: [],
    heroBannersLoading: false,
    heroBannersError: null,
    loadHeroBanners: async () => {
        set({ heroBannersLoading: true, heroBannersError: null });
        try {
            const { heroBannersApi } = await import('../api/salvemundi');
            const data = await heroBannersApi.getAll();
            set({ heroBanners: data, heroBannersLoading: false });
        } catch (error) {
            console.error('Failed to load hero banners:', error);
            set({
                heroBannersError: error instanceof Error ? error.message : 'Failed to load hero banners',
                heroBannersLoading: false,
            });
        }
    },
}));
