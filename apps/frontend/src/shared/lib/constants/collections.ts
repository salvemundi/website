export const COLLECTIONS = {
    PUB_CRAWL_EVENTS: 'pub_crawl_events',
    PUB_CRAWL_SIGNUPS: 'pub_crawl_signups',
    PUB_CRAWL_TICKETS: 'pub_crawl_tickets',
} as const;

export const FIELDS = {
    SIGNUPS: {
        PUB_CRAWL_EVENT_ID: 'pub_crawl_event_id',
    },
    TICKETS: {
        SIGNUP_ID: 'signup_id',
        QR_TOKEN: 'qr_token',
        CHECKED_IN: 'checked_in',
        CHECKED_IN_AT: 'checked_in_at',
        NAME: 'name',
    }
} as const;
