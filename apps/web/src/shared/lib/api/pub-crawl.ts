import {
    getPubCrawlEventsAction,
    getPubCrawlEventByIdAction,
    createPubCrawlEventAction,
    updatePubCrawlEventAction,
    deletePubCrawlEventAction,
    getPubCrawlSignupsAction,
    getPubCrawlSignupsByEventIdAction,
    createPubCrawlSignupAction,
    getPubCrawlSignupByIdAction,
    updatePubCrawlSignupAction,
    deletePubCrawlSignupAction,
    getPubCrawlTicketsAction,
    getPubCrawlTicketsBySignupIdAction,
    getPubCrawlTicketsByEventIdAction
} from '@/shared/api/data-actions';

export const pubCrawlEventsApi = {
    getAll: async () => {
        return await getPubCrawlEventsAction();
    },
    getById: async (id: number | string) => {
        return await getPubCrawlEventByIdAction(id);
    },
    create: async (data: any) => {
        return await createPubCrawlEventAction(data);
    },
    update: async (id: number | string, data: any) => {
        return await updatePubCrawlEventAction(id, data);
    },
    delete: async (id: number | string) => {
        return await deletePubCrawlEventAction(id);
    }
};

export const pubCrawlSignupsApi = {
    getAll: async () => {
        return await getPubCrawlSignupsAction();
    },
    getByEventId: async (eventId: number) => {
        return await getPubCrawlSignupsByEventIdAction(eventId);
    },
    create: async (data: any) => {
        return await createPubCrawlSignupAction(data);
    },
    getById: async (id: number | string) => {
        return await getPubCrawlSignupByIdAction(id);
    },
    update: async (id: number | string, data: any) => {
        return await updatePubCrawlSignupAction(id, data);
    },
    delete: async (id: number | string) => {
        return await deletePubCrawlSignupAction(id);
    }
};

export const pubCrawlTicketsApi = {
    getAll: async () => {
        return await getPubCrawlTicketsAction();
    },
    getBySignupId: async (signupId: number | string) => {
        return await getPubCrawlTicketsBySignupIdAction(signupId);
    },
    getByEventId: async (eventId: number | string) => {
        return await getPubCrawlTicketsByEventIdAction(eventId);
    }
};
