import {
    getMembersAction,
    getMemberByIdAction,
} from '@/shared/api/data-actions';

export const membersApi = {
    getAll: async () => {
        return await getMembersAction();
    },
    getById: async (id: number) => {
        return await getMemberByIdAction(id);
    }
};
