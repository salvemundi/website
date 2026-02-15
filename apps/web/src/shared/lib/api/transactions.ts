import {
    getTransactionsAction,
    getTransactionByIdAction,
} from '@/shared/api/data-actions';

export const transactionsApi = {
    getAll: async (userId: string) => {
        return await getTransactionsAction(userId);
    },
    getById: async (id: number | string) => {
        return await getTransactionByIdAction(id);
    }
};
