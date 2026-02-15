import { searchUsersAction } from '@/shared/api/data-actions';

export const usersApi = {
    search: async (searchQuery: string) => {
        return await searchUsersAction(searchQuery);
    }
};
