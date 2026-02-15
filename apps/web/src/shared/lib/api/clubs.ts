import {
    getClubsAction,
    getClubByIdAction,
} from '@/shared/api/data-actions';

export const clubsApi = {
    getAll: async () => {
        return await getClubsAction();
    },
    getById: async (id: number) => {
        return await getClubByIdAction(id);
    }
};
