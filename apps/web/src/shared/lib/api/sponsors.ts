import {
    getSponsorsAction,
} from '@/shared/api/data-actions';

export const sponsorsApi = {
    getAll: async () => {
        return await getSponsorsAction();
    }
};
