import { getHeroBannersAction } from '@/shared/api/data-actions';

export const heroBannersApi = {
    getAll: async () => {
        return await getHeroBannersAction();
    }
};
