import {
    getCommitteesAction,
    getCommitteesWithMembersAction,
    getCommitteeByIdAction,
} from '@/shared/api/data-actions';

export const committeesApi = {
    getAll: async () => {
        return await getCommitteesAction();
    },
    getAllWithMembers: async () => {
        return await getCommitteesWithMembersAction();
    },
    getById: async (id: number) => {
        return await getCommitteeByIdAction(id);
    }
};
