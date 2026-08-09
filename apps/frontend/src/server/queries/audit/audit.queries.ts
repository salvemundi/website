import 'server-only';
import { z } from 'zod';
import { db, schema } from '@salvemundi/db';
import { eq, and, desc, sql, or, ilike, notIlike, inArray, notInArray } from 'drizzle-orm';
import { type PendingSignup } from '@salvemundi/validations/schema/audit.zod';
import { safeConsoleError } from '@/server/utils/logger';

import { type SystemLog, SystemLogSchema } from '@salvemundi/validations';
export type { SystemLog };

export async function getPendingSignupsInternal(): Promise<PendingSignup[]> {
    try {
        const rows = await db.select({
            mollie_id: schema.transactions.mollie_id,
            created_at: schema.transactions.created_at,
            email: schema.transactions.email,
            first_name: schema.transactions.first_name,
            last_name: schema.transactions.last_name,
            product_name: schema.transactions.product_name,
            amount: schema.transactions.amount,
            payment_status: schema.transactions.payment_status,
            approval_status: schema.transactions.approval_status,
            user_id: schema.transactions.user_id
        }).from(schema.transactions)
        .where(
            and(
                eq(schema.transactions.product_type, 'membership'),
                eq(schema.transactions.payment_status, 'paid'),
                eq(schema.transactions.approval_status, 'pending')
            )
        )
        .orderBy(desc(schema.transactions.created_at));

        const result: PendingSignup[] = rows.map((s) => ({
            id: s.mollie_id || '',
            created_at: s.created_at ? String(s.created_at) : new Date().toISOString(),
            email: s.email || '',
            first_name: s.first_name || '',
            last_name: s.last_name || '',
            product_name: s.product_name || '',
            amount: Number(s.amount ?? 0),
            approval_status: 'pending' as const,
            payment_status: s.payment_status || 'paid',
            type: s.user_id ? 'membership_renewal' as const : 'membership_new' as const
        }));

        return result;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getPendingSignupsInternal] ', `Failed to fetch pending signups: ${typedError.message}`);
        throw error;
    }
}

export async function getSystemLogsInternal(limit: number = 50, source: 'admin' | 'system' = 'admin'): Promise<{ logs: SystemLog[]; totalCount: number }> {
    try {
        const legacyAdminTypes = [
            'impersonation_active',
            'impersonation_started',
            'impersonation_ended',
            'signup_approved',
            'signup_rejected',
            'activity_created',
            'activity_updated',
            'activity_deleted',
            'event_signup_manual_created',
            'membership_renewed',
            'member_profile_updated',
            'settings_change',
            'sticker_deleted'
        ];

        const filterCond = source === 'admin'
            ? or(ilike(schema.system_logs.type, 'admin_%'), inArray(schema.system_logs.type, legacyAdminTypes))
            : and(notIlike(schema.system_logs.type, 'admin_%'), notInArray(schema.system_logs.type, legacyAdminTypes));

        const [logsResult, countResult] = await Promise.all([
            db.select().from(schema.system_logs).where(filterCond).orderBy(desc(schema.system_logs.created_at)).limit(limit),
            db.select({ total: sql<number>`COUNT(*)` }).from(schema.system_logs).where(filterCond)
        ]);

        const logs: SystemLog[] = logsResult.map(r => {
            let parsedPayload: z.infer<typeof SystemLogSchema>['payload'] = {};

            if (typeof r.payload === 'string') {
                try {
                    parsedPayload = JSON.parse(r.payload) as z.infer<typeof SystemLogSchema>['payload'];
                } catch (parseError) {
                    safeConsoleError('[audit.queries.ts][getSystemLogsInternal] ', parseError);
                    parsedPayload = { error: 'Invalid JSON payload string' };
                }
            } else {
                parsedPayload = r.payload as z.infer<typeof SystemLogSchema>['payload'];
            }

            return SystemLogSchema.parse({
                id: r.id,
                type: r.type,
                status: r.status,
                created_at: r.created_at || new Date().toISOString(),
                acknowledged_at: r.acknowledged_at || null,
                payload: parsedPayload
            });
        });

        const totalCount = Number(countResult[0]?.total ?? 0);

        return { logs, totalCount };
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getSystemLogsInternal] ', `Failed to fetch system logs: ${typedError.message}`);
        throw error;
    }
}

export async function insertSystemLogInternal(data: {
    type: string,
    status: string,
    payload: unknown
}): Promise<void> {
    try {
        let payload = data.payload;
        if (JSON.stringify(payload).length > 20000) {
            payload = {
                error: 'Payload truncated due to size limit',
                original_type: data.type,
                truncated: true
            };
        }

        const environment = process.env.ENV_NAME === 'prod' 
            ? 'productie' 
            : (process.env.ENV_NAME === 'acc' ? 'acceptatie' : 'ontwikkeling');

        if (payload && typeof payload === 'object') {
            payload = {
                ...(payload as Record<string, unknown>),
                environment
            };
        } else {
            payload = {
                value: payload,
                environment
            };
        }

        await db.insert(schema.system_logs).values({
            type: data.type,
            status: data.status,
            payload: payload,
            created_at: sql`NOW()`.mapWith(String)
        });
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][insertSystemLogInternal] ', `Failed to insert system log: ${typedError.message}`);
    }
}

export async function getDynamicIdNameLookup(idsToFetch: { prefix: string, id: string }[]): Promise<Record<string, string>> {
    try {
        if (idsToFetch.length === 0) return {};

        const idsByPrefix = idsToFetch.reduce((acc, { prefix, id }) => {
            const list = acc.get(prefix) ?? [];
            list.push(id);
            acc.set(prefix, list);
            return acc;
        }, new Map<string, string[]>());

        const queries: Promise<{ key: string; name: string }[]>[] = [];

        const committeeIds = idsByPrefix.get('committee_');
        if (committeeIds && committeeIds.length > 0) {
            const validIds = committeeIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'committee_' || ${schema.committees.id}::text`,
                    name: sql<string>`COALESCE(${schema.committees.name}, '')`
                }).from(schema.committees)
                .where(inArray(schema.committees.id, validIds)));
            }
        }

        const eventIds = idsByPrefix.get('event_');
        if (eventIds && eventIds.length > 0) {
            const validIds = eventIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'event_' || ${schema.events.id}::text`,
                    name: sql<string>`COALESCE(${schema.events.name}, '')`
                }).from(schema.events)
                .where(inArray(schema.events.id, validIds)));
            }
        }

        const tripIds = idsByPrefix.get('trip_');
        if (tripIds && tripIds.length > 0) {
            const validIds = tripIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'trip_' || ${schema.trips.id}::text`,
                    name: sql<string>`COALESCE(${schema.trips.name}, '')`
                }).from(schema.trips)
                .where(inArray(schema.trips.id, validIds)));
            }
        }

        const userIds = idsByPrefix.get('user_');
        if (userIds && userIds.length > 0) {
            const validUserIds = userIds.filter(id => 
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
            );
            if (validUserIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'user_' || ${schema.directus_users.id}::text`,
                    name: sql<string>`COALESCE(NULLIF(TRIM(COALESCE(${schema.directus_users.first_name}, '') || ' ' || COALESCE(${schema.directus_users.last_name}, '')), ''), ${schema.directus_users.email})::text || COALESCE(' (' || (
                        SELECT string_agg("committees"."name", ', ')
                        FROM "committee_members"
                        JOIN "committees" ON "committees"."id" = "committee_members"."committee_id"
                        WHERE "committee_members"."user_id" = "directus_users"."id"
                    ) || ')', '')`
                }).from(schema.directus_users)
                .where(inArray(schema.directus_users.id, validUserIds)));
            }
        }

        const stickerIds = idsByPrefix.get('sticker_');
        if (stickerIds && stickerIds.length > 0) {
            const validIds = stickerIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'sticker_' || ${schema.Stickers.id}::text`,
                    name: sql<string>`COALESCE(${schema.Stickers.location_name}, '')`
                }).from(schema.Stickers)
                .where(inArray(schema.Stickers.id, validIds)));
            }
        }

        const dropWindowIds = idsByPrefix.get('drop_window_');
        if (dropWindowIds && dropWindowIds.length > 0) {
            const validIds = dropWindowIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'drop_window_' || ${schema.webshop_drop_windows.id}::text`,
                    name: sql<string>`COALESCE(${schema.webshop_drop_windows.name}, '')`
                }).from(schema.webshop_drop_windows)
                .where(inArray(schema.webshop_drop_windows.id, validIds)));
            }
        }

        const preorderIds = idsByPrefix.get('preorder_');
        if (preorderIds && preorderIds.length > 0) {
            const validIds = preorderIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'preorder_' || ${schema.webshop_preorders.id}::text`,
                    name: sql<string>`(COALESCE(NULLIF(TRIM(COALESCE(${schema.webshop_preorders.first_name}, '') || ' ' || COALESCE(${schema.webshop_preorders.last_name}, '')), ''), ${schema.webshop_preorders.email}) || ' (' || COALESCE(${schema.webshop_drop_windows.name}, 'Onbekende drop') || ')')::text`
                })
                .from(schema.webshop_preorders)
                .leftJoin(schema.webshop_drop_windows, eq(schema.webshop_preorders.drop_window_id, schema.webshop_drop_windows.id))
                .where(inArray(schema.webshop_preorders.id, validIds)));
            }
        }

        const productIds = idsByPrefix.get('product_');
        if (productIds && productIds.length > 0) {
            const validIds = productIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'product_' || ${schema.webshop_products.id}::text`,
                    name: sql<string>`COALESCE(${schema.webshop_products.name}, '')`
                }).from(schema.webshop_products)
                .where(inArray(schema.webshop_products.id, validIds)));
            }
        }

        const signupIds = idsByPrefix.get('signup_');
        if (signupIds && signupIds.length > 0) {
            const validIds = signupIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'signup_' || ${schema.trip_signups.id}::text`,
                    name: sql<string>`(COALESCE(NULLIF(TRIM(COALESCE(${schema.trip_signups.first_name}, '') || ' ' || COALESCE(${schema.trip_signups.last_name}, '')), ''), ${schema.trip_signups.email}) || ' (' || COALESCE(${schema.trips.name}, 'Onbekende reis') || ')')::text`
                })
                .from(schema.trip_signups)
                .leftJoin(schema.trips, eq(schema.trip_signups.trip_id, schema.trips.id))
                .where(inArray(schema.trip_signups.id, validIds)));
            }
        }

        const tripActivityIds = idsByPrefix.get('trip_activity_');
        if (tripActivityIds && tripActivityIds.length > 0) {
            const validIds = tripActivityIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'trip_activity_' || ${schema.trip_activities.id}::text`,
                    name: sql<string>`COALESCE(${schema.trip_activities.name}, '')`
                }).from(schema.trip_activities)
                .where(inArray(schema.trip_activities.id, validIds)));
            }
        }

        const eventSignupIds = idsByPrefix.get('event_signup_');
        if (eventSignupIds && eventSignupIds.length > 0) {
            const validIds = eventSignupIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'event_signup_' || ${schema.event_signups.id}::text`,
                    name: sql<string>`(COALESCE(NULLIF(TRIM(${schema.event_signups.participant_name}), ''), ${schema.event_signups.participant_email}) || ' (' || COALESCE(${schema.events.name}, 'Onbekend evenement') || ')')::text`
                })
                .from(schema.event_signups)
                .leftJoin(schema.events, eq(schema.event_signups.event_id, schema.events.id))
                .where(inArray(schema.event_signups.id, validIds)));
            }
        }

        const vacancyIds = idsByPrefix.get('vacancy_');
        if (vacancyIds && vacancyIds.length > 0) {
            const validIds = vacancyIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'vacancy_' || ${schema.vacancies.id}::text`,
                    name: sql<string>`COALESCE(${schema.vacancies.title}, '')`
                }).from(schema.vacancies)
                .where(inArray(schema.vacancies.id, validIds)));
            }
        }

        const vacancySubmissionIds = idsByPrefix.get('vacancy_submission_');
        if (vacancySubmissionIds && vacancySubmissionIds.length > 0) {
            const validIds = vacancySubmissionIds.map(Number).filter(id => !isNaN(id) && isFinite(id));
            if (validIds.length > 0) {
                queries.push(db.select({
                    key: sql<string>`'vacancy_submission_' || ${schema.vacancy_submissions.id}::text`,
                    name: sql<string>`COALESCE(${schema.vacancy_submissions.title}, '')`
                }).from(schema.vacancy_submissions)
                .where(inArray(schema.vacancy_submissions.id, validIds)));
            }
        }

        if (queries.length === 0) return {};

        const results = await Promise.all(queries);
        const rows = results.flat();
        
        const lookup: Record<string, string> = {};
        for (const row of rows) {
            lookup[row.key] = row.name;
        }
        return lookup;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[audit.queries.ts][getDynamicIdNameLookup] ', `Failed to fetch dynamic ID name lookup: ${typedError.message}`);
        return {};
    }
}