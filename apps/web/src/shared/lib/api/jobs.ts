import {
    getJobsAction,
    getJobByIdAction,
} from '@/shared/api/data-actions';

export const jobsApi = {
    getAll: async () => {
        return await getJobsAction();
    },
    getById: async (id: number) => {
        return await getJobByIdAction(id);
    }
};
