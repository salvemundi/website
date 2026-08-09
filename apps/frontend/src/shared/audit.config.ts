export type AuditContextRule = (context?: string, logType?: string) => boolean;

export interface AuditKeyMapping {
    keys: string[];
    prefix: string;
    condition?: AuditContextRule;
}

export const auditKeyMappings: AuditKeyMapping[] = [
    {
        keys: ['committee_id'],
        prefix: 'committee_'
    },
    {
        keys: ['event_id'],
        prefix: 'event_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'activiteit' && !['admin_event_signup_checked_in', 'admin_event_signup_checked_out', 'admin_event_signup_deleted', 'admin_event_signup_manual_created', 'system_event_signup_checkin_rollback', 'system_event_signup_delete_failed'].includes(logType || ''),
        prefix: 'event_'
    },
    {
        keys: ['trip_id'],
        prefix: 'trip_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'reis' && !['admin_trip_signup_status_updated', 'admin_trip_signup_deleted', 'admin_trip_signup_updated', 'admin_trip_signup_activities_updated'].includes(logType || ''),
        prefix: 'trip_'
    },
    {
        keys: ['admin_id', 'target_id', 'user_id', 'member_id'],
        prefix: 'user_'
    },
    {
        keys: ['signup_id'],
        prefix: 'signup_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'reis' && ['admin_trip_signup_status_updated', 'admin_trip_signup_deleted', 'admin_trip_signup_updated', 'admin_trip_signup_activities_updated'].includes(logType || ''),
        prefix: 'signup_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'activiteit' && ['admin_event_signup_checked_in', 'admin_event_signup_checked_out', 'admin_event_signup_deleted', 'admin_event_signup_manual_created', 'system_event_signup_checkin_rollback', 'system_event_signup_delete_failed'].includes(logType || ''),
        prefix: 'event_signup_'
    },
    {
        keys: ['sticker_id'],
        prefix: 'sticker_'
    },
    {
        keys: ['drop_window_id'],
        prefix: 'drop_window_'
    },
    {
        keys: ['product_id'],
        prefix: 'product_'
    },
    {
        keys: ['preorder_id'],
        prefix: 'preorder_'
    },
    {
        keys: ['trip_activity_id'],
        prefix: 'trip_activity_'
    },
    {
        keys: ['vacancy_id'],
        prefix: 'vacancy_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'vacature' && ['admin_vacancy_created', 'admin_vacancy_updated', 'admin_vacancy_deleted'].includes(logType || ''),
        prefix: 'vacancy_'
    },
    {
        keys: ['id'],
        condition: (context, logType) => context === 'vacature' && ['admin_vacancy_submission_approved', 'admin_vacancy_submission_rejected', 'admin_vacancy_submission_deleted'].includes(logType || ''),
        prefix: 'vacancy_submission_'
    }
];

export function getLookupPrefix(key: string, context?: string, logType?: string): string | null {
    for (const mapping of auditKeyMappings) {
        if (mapping.keys.includes(key)) {
            if (mapping.condition) {
                if (mapping.condition(context, logType)) {
                    return mapping.prefix;
                }
            } else {
                return mapping.prefix;
            }
        }
    }
    return null;
}
