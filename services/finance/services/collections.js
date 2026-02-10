/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated on: 2026-02-01T17:47:32.820Z
 */

const COLLECTIONS = {
    PUB_CRAWL_EVENTS: 'pub_crawl_events',
    PUB_CRAWL_SIGNUPS: 'pub_crawl_signups',
    PUB_CRAWL_TICKETS: 'pub_crawl_tickets',
};

const FIELDS = {
    EVENTS: {
        ID: 'id',
        NAME: 'name',
        EMAIL: 'email',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at',
        IMAGE: 'image',
        DATE: 'date',
        DESCRIPTION: 'description',
        PUB_CRAWL_SIGNUPS: 'pub_crawl_signups',
    },
    SIGNUPS: {
        ID: 'id',
        ASSOCIATION: 'association',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at',
        PUB_CRAWL_EVENT_ID: 'pub_crawl_event_id',
        EMAIL: 'email',
        NAME: 'name',
        AMOUNT_TICKETS: 'amount_tickets',
        PAYMENT_STATUS: 'payment_status',
        TRANSACTIONS: 'transactions',
    },
    TICKETS: {
        ID: 'id',
        SIGNUP_ID: 'signup_id',
        NAME: 'name',
        INITIAL: 'initial',
        QR_TOKEN: 'qr_token',
        CHECKED_IN: 'checked_in',
        CHECKED_IN_AT: 'checked_in_at',
        CREATED_AT: 'created_at',
        UPDATED_AT: 'updated_at',
    }
};

module.exports = { COLLECTIONS, FIELDS };
