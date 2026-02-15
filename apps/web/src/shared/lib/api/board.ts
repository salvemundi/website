import { getBoards } from '@/shared/api/board-actions';

export const boardApi = {
    getAll: async () => {
        // Use Server Action to fetch data with Admin Token, bypassing client-side user permissions
        return await getBoards();
    }
};
