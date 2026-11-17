import 'server-only';

import { db, schema } from '@salvemundi/db';
import { and, eq, isNotNull } from 'drizzle-orm';
import { COMMITTEES } from '@/shared/lib/permissions-config';
import { hhmm, type CameraPeriod } from '@/shared/lib/camera-period';
import { safeConsoleError } from '@/server/utils/logger';

const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN?.replace(/^"|"$/g, '').trim();

type MailData = Record<string, string | number | boolean | null | undefined>;

export async function sendCameraMail(to: string, templateId: string, data: MailData): Promise<boolean> {
    if (!INTERNAL_SERVICE_TOKEN || !process.env.MAIL_SERVICE_URL) {
        safeConsoleError('[camera-mail.ts][sendCameraMail] Missing INTERNAL_SERVICE_TOKEN or MAIL_SERVICE_URL');
        return false;
    }

    try {
        const response = await fetch(`${process.env.MAIL_SERVICE_URL}/api/mail/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${INTERNAL_SERVICE_TOKEN}`,
            },
            body: JSON.stringify({ to, templateId, data }),
        });
        if (!response.ok) {
            safeConsoleError('[camera-mail.ts][sendCameraMail] ', await response.text());
            return false;
        }
        return true;
    } catch (error) {
        safeConsoleError('[camera-mail.ts][sendCameraMail] ', error);
        return false;
    }
}

const formatDay = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

export function formatMailDate(date: string): string {
    return formatDay(date);
}

export function formatMailPeriod(p: CameraPeriod): string {
    const from = `${formatDay(p.start_date)}${p.start_time ? ` ${hhmm(p.start_time)}` : ''}`;
    const to = `${formatDay(p.end_date)}${p.end_time ? ` ${hhmm(p.end_time)}` : ''}`;
    return p.start_date === p.end_date && !p.start_time && !p.end_time ? from : `${from} t/m ${to}`;
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/** E-mailadressen van de MEDIA-commissie: zij beoordelen de aanvragen. */
export async function getCameraAdminEmails(): Promise<string[]> {
    try {
        const rows = await db
            .select({ email: schema.directus_users.email })
            .from(schema.committee_members)
            .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
            .innerJoin(schema.directus_users, eq(schema.committee_members.user_id, schema.directus_users.id))
            .where(and(eq(schema.committees.azure_group_id, COMMITTEES.MEDIA), isNotNull(schema.directus_users.email)));
        return [...new Set(rows.map((r) => r.email).filter((e): e is string => !!e))];
    } catch (error) {
        safeConsoleError('[camera-mail.ts][getCameraAdminEmails] Error:', error);
        return [];
    }
}

export async function getUserMailInfo(userId: string): Promise<{ name: string; email: string | null } | null> {
    const rows = await db
        .select({
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name,
            email: schema.directus_users.email,
        })
        .from(schema.directus_users)
        .where(eq(schema.directus_users.id, userId))
        .limit(1);
    if (rows.length === 0) return null;
    return {
        name: `${rows[0].first_name ?? ''} ${rows[0].last_name ?? ''}`.trim() || 'lid',
        email: rows[0].email,
    };
}
