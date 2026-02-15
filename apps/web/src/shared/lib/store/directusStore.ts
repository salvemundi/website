import { create } from 'zustand';
import { clubsApi } from '../api/clubs';
import { sponsorsApi } from '../api/sponsors';

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
}

export const useDirectusStore = create<DirectusStore>((set) => ({
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
}));
