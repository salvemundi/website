import { getWhatsappGroupsAction } from '@/shared/api/data-actions';

export const whatsappGroupsApi = {
    getAll: async (memberOnly: boolean = false) => {
        return await getWhatsappGroupsAction(memberOnly);
    }
};
