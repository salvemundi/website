import {
    getEventsAction,
    getEventByIdAction,
    getEventsByCommitteeAction,
    createEventSignupAction
} from '@/shared/api/data-actions';

export const eventsApi = {
    getAll: async () => {
        return await getEventsAction();
    },
    getById: async (id: string) => {
        return await getEventByIdAction(id);
    },
    getByCommittee: async (committeeId: number) => {
        return await getEventsByCommitteeAction(committeeId);
    },
    createSignup: async (signupData: { event_id: number; email: string; name: string; phone_number?: string; user_id?: string; event_name?: string; event_date?: string; event_price?: number; payment_status?: string }) => {
        return await createEventSignupAction(signupData);
    },
};
