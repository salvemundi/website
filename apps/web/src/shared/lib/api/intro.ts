import {
    getIntroSignupsAction,
    createIntroSignupAction,
    updateIntroSignupAction,
    deleteIntroSignupAction,
    getIntroBlogsAction,
    getIntroBlogsAdminAction,
    getIntroBlogByIdAction,
    getIntroBlogsByTypeAction,
    createIntroBlogAction,
    updateIntroBlogAction,
    deleteIntroBlogAction,
    getIntroPlanningAction,
    getIntroPlanningAdminAction,
    createIntroPlanningAction,
    updateIntroPlanningAction,
    deleteIntroPlanningAction,
    getIntroParentSignupsAction,
    getIntroParentSignupsByUserIdAction,
    createIntroParentSignupAction,
    updateIntroParentSignupAction,
    deleteIntroParentSignupAction
} from '@/shared/api/data-actions';
import type { IntroSignup, IntroBlog, IntroPlanningItem, IntroParentSignup } from './types';

export const introSignupsApi = {
    create: async (data: any) => {
        return await createIntroSignupAction(data);
    },
    getAll: async (): Promise<IntroSignup[]> => {
        return await getIntroSignupsAction();
    },
    update: async (id: number, data: Partial<IntroSignup>) => {
        return await updateIntroSignupAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroSignupAction(id);
    }
};

export const introBlogsApi = {
    getAll: async (): Promise<IntroBlog[]> => {
        return await getIntroBlogsAction();
    },
    getAllAdmin: async (): Promise<IntroBlog[]> => {
        return await getIntroBlogsAdminAction();
    },
    getById: async (id: number): Promise<IntroBlog> => {
        return await getIntroBlogByIdAction(id);
    },
    getByType: async (type: 'update' | 'pictures' | 'event' | 'announcement'): Promise<IntroBlog[]> => {
        return await getIntroBlogsByTypeAction(type);
    },
    create: async (data: Partial<IntroBlog>) => {
        return await createIntroBlogAction(data);
    },
    update: async (id: number, data: Partial<IntroBlog>) => {
        return await updateIntroBlogAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroBlogAction(id);
    }
};

export const introPlanningApi = {
    getAll: async (): Promise<IntroPlanningItem[]> => {
        return await getIntroPlanningAction();
    },
    getAllAdmin: async (): Promise<IntroPlanningItem[]> => {
        return await getIntroPlanningAdminAction();
    },
    create: async (data: Partial<IntroPlanningItem>) => {
        return await createIntroPlanningAction(data);
    },
    update: async (id: number, data: Partial<IntroPlanningItem>) => {
        return await updateIntroPlanningAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroPlanningAction(id);
    }
};

export const introParentSignupsApi = {
    create: async (data: IntroParentSignup) => {
        return await createIntroParentSignupAction(data);
    },
    getByUserId: async (userId: string): Promise<IntroParentSignup[]> => {
        return await getIntroParentSignupsByUserIdAction(userId);
    },
    getAll: async (): Promise<IntroParentSignup[]> => {
        return await getIntroParentSignupsAction();
    },
    update: async (id: number, data: Partial<IntroParentSignup>) => {
        return await updateIntroParentSignupAction(id, data);
    },
    delete: async (id: number) => {
        return await deleteIntroParentSignupAction(id);
    }
};
