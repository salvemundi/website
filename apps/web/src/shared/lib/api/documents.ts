import { getDocumentsAction } from '@/shared/api/data-actions';

export const documentsApi = {
    getAll: async () => {
        return await getDocumentsAction();
    }
};
