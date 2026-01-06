import { create } from 'zustand';
import { eventsApi, clubsApi, committeesApi, sponsorsApi } from '../api/salvemundi';
import { MOCK_COMMITTEES } from '../mockData';

interface Event {
    id: number | string;
    name: string;
    event_date: string;
    inschrijf_deadline?: string;
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
    image?: string | { id: number; filename?: string } | null;
    is_visible?: boolean;
    short_description?: string;
    description?: string;
    committee_members?: CommitteeMember[];
    created_at?: string;
    updated_at?: string;
}

interface CommitteeMember {
    id: number;
    name: string;
    role?: string;
    image?: string | null;
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
    heroBanners: HeroBanner[];
    heroBannersLoading: boolean;
    heroBannersError: string | null;
    loadHeroBanners: () => Promise<void>;
}

interface HeroBanner {
    id: number;
    title?: string;
    image?: string;
    link?: string;
}

export const useDirectusStore = create<DirectusStore>((set) => ({
    // Events
    events: [],
    eventsLoading: false,
    eventsError: null,
    loadEvents: async () => {
        set({ eventsLoading: true, eventsError: null });
        try {
            const data = await eventsApi.getAll() as Event[];
            set({ events: data, eventsLoading: false });
        } catch (error) {
            console.error('Failed to load events:', error);
            set({
                events: [],
                eventsLoading: false,
                eventsError: error instanceof Error ? error.message : 'Failed to load events',
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
            const data = await committeesApi.getAllWithMembers() as Committee[];
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
            const data = await clubsApi.getAll() as Club[];
            set({ clubs: data, clubsLoading: false });
        } catch (error) {
            console.error('Failed to load clubs:', error);
            set({
                clubs: [],
                clubsLoading: false,
                clubsError: error instanceof Error ? error.message : 'Failed to load clubs',
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
            const data = await sponsorsApi.getAll() as Sponsor[];
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
            const data = await heroBannersApi.getAll() as HeroBanner[];
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
