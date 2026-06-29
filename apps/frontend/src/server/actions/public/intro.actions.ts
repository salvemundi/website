'use server';

import {
    introSignupFormSchema,
    introParentSignupFormSchema,
    type IntroSignupForm,
    type IntroParentSignupForm,
    type IntroBlog
} from '@salvemundi/validations/schema/intro.zod';
import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { eq, desc } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { normalizeDate } from '@/lib/utils/date-utils';
import { safeConsoleError } from '@/server/utils/logger';

interface ParentSignupRecord {
    id: number;
    user_id: string | null;
    email: string | null;
}

const getMailUrl = () => process.env.MAIL_SERVICE_URL;

const getServiceHeaders = (): HeadersInit => {
    const token = (process.env.INTERNAL_SERVICE_TOKEN || '').replace(/^"|"$/g, '').trim();
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export async function getIntroSettings() {
    try {
        const rows = await db.select({
            is_active: schema.feature_flags.is_active,
            message: schema.feature_flags.message
        }).from(schema.feature_flags)
        .where(eq(schema.feature_flags.route_match, '/intro'))
        .limit(1);

        if (rows.length === 0) {
            return {
                show: false,
                disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.'
            };
        }

        const data = rows[0];

        return {
            show: data.is_active,
            disabled_message: data.message ?? 'De inschrijvingen voor de introweek zijn momenteel gesloten.'
        };
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroSettings] Error while fetching intro settings:`, error);
        return { show: false, disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' };
    }
}

export async function hasParentSignup(): Promise<boolean> {
    const check = await checkParentSignupInternal();
    return check.exists;
}

async function checkParentSignupInternal(): Promise<{ exists: boolean; record?: ParentSignupRecord }> {
    const session = await getEnrichedSession();

    if (!session?.user) return { exists: false };

    try {
        const signups = await db.query.intro_parent_signups.findMany({
            where: eq(schema.intro_parent_signups.user_id, session.user.id),
            columns: { id: true, user_id: true, email: true },
            limit: 1
        });

        if (signups.length > 0 && signups[0]) {
            return { exists: true, record: signups[0] };
        }

        return { exists: false };
    } catch (error: unknown) {
        safeConsoleError('[intro.actions.ts][checkParentSignupInternal] DB check failed:', error);
        throw error;
    }
}

export async function submitIntroSignup(data: IntroSignupForm): Promise<{ success: boolean; error?: string }> {
    const normalizedGeboorte = normalizeDate(data.geboortedatum);
    data.geboortedatum = normalizedGeboorte ?? data.geboortedatum;

    const parsed = introSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('intro-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.' };
    }

    if (parsed.data.website) {
        return { success: true };
    }

    const payload = {
        first_name: parsed.data.voornaam,
        last_name: parsed.data.achternaam,
        date_of_birth: parsed.data.geboortedatum,
        email: parsed.data.email,
        phone_number: parsed.data.telefoonnummer,
        favorite_gif: parsed.data.favorieteGif || null
    };

    try {
        await db.insert(schema.intro_signups).values(payload);
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][submitIntroSignup] Error while submitting intro signup:`, error);
        throw new Error('Er is een fout opgetreden bij je inschrijving');
    }

    fetch(`${getMailUrl()}/api/mail/send`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({
            templateId: 'intro-signup',
            to: payload.email,
            data: {
                firstName: payload.first_name,
                lastName: payload.last_name,
                phone: payload.phone_number
            }
        })
    }).catch((error: unknown) => {
        safeConsoleError(`[intro.actions.ts][submitIntroSignup] Error while triggering mail microservice:`, error);
    });
    return { success: true };
}

export async function getIntroBlogsPublic(): Promise<IntroBlog[]> {
    try {
        const rows = await db.select({
            id: schema.intro_blogs.id,
            title: schema.intro_blogs.title,
            content: schema.intro_blogs.content,
            slug: schema.intro_blogs.slug,
            excerpt: schema.intro_blogs.excerpt,
            image: schema.intro_blogs.image,
            is_published: schema.intro_blogs.is_published,
            created_at: schema.intro_blogs.created_at,
            updated_at: schema.intro_blogs.updated_at
        }).from(schema.intro_blogs)
        .where(eq(schema.intro_blogs.is_published, true))
        .orderBy(desc(schema.intro_blogs.id))
        .limit(6);
        return rows as unknown as IntroBlog[];
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroBlogsPublic] Error while fetching intro blogs:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blogs');
    }
}

export async function getAllIntroBlogsPublic(): Promise<IntroBlog[]> {
    try {
        const rows = await db.select({
            id: schema.intro_blogs.id,
            title: schema.intro_blogs.title,
            content: schema.intro_blogs.content,
            slug: schema.intro_blogs.slug,
            excerpt: schema.intro_blogs.excerpt,
            image: schema.intro_blogs.image,
            is_published: schema.intro_blogs.is_published,
            created_at: schema.intro_blogs.created_at,
            updated_at: schema.intro_blogs.updated_at
        }).from(schema.intro_blogs)
        .where(eq(schema.intro_blogs.is_published, true))
        .orderBy(desc(schema.intro_blogs.id));
        return rows as unknown as IntroBlog[];
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getAllIntroBlogsPublic] Error while fetching all intro blogs:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blogs');
    }
}

export async function getIntroBlogBySlug(slug: string): Promise<IntroBlog | null> {
    try {
        const { and } = await import('drizzle-orm');
        const rows = await db.select({
            id: schema.intro_blogs.id,
            title: schema.intro_blogs.title,
            content: schema.intro_blogs.content,
            slug: schema.intro_blogs.slug,
            excerpt: schema.intro_blogs.excerpt,
            image: schema.intro_blogs.image,
            is_published: schema.intro_blogs.is_published,
            created_at: schema.intro_blogs.created_at,
            updated_at: schema.intro_blogs.updated_at
        }).from(schema.intro_blogs)
        .where(and(
            eq(schema.intro_blogs.slug, slug),
            eq(schema.intro_blogs.is_published, true)
        ))
        .limit(1);
        return rows.length > 0 ? (rows[0] as unknown as IntroBlog) : null;
    } catch (error: unknown) {
        safeConsoleError(`[intro.actions.ts][getIntroBlogBySlug] Error while fetching intro blog by slug:`, error);
        throw new Error('Er is een fout opgetreden bij het ophalen van de intro blog');
    }
}

export async function submitIntroParentSignup(data: IntroParentSignupForm): Promise<{ success: boolean; error?: string }> {
    const session = await getEnrichedSession();

    if (!session?.user) {
        return { success: false, error: 'Je moet ingelogd zijn als lid om je aan te melden als Intro Ouder' };
    }

    const check = await checkParentSignupInternal();
    if (check.exists && check.record) {
        return { success: true };
    }

    const { rateLimit } = await import('@/server/utils/ratelimit');
    const { success } = await rateLimit('intro-parent-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen. Probeer het over een paar minuten opnieuw.' };
    }

    const parsed = introParentSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const rawName = session.user.name;
    const nameParts = rawName.split(' ');

    const payload = {
        user_id: session.user.id,
        first_name: nameParts[0] || rawName,
        last_name: nameParts.slice(1).join(' '),
        email: session.user.email,
        phone_number: parsed.data.telefoonnummer,
        motivation: parsed.data.motivation,
        availability: []
    };

    try {
        await db.insert(schema.intro_parent_signups).values(payload);
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (error: unknown) {
        safeConsoleError('[intro.actions.ts][submitIntroParentSignup] Error details:', error);
        return { success: false, error: 'Er is een fout opgetreden bij uw aanmelding' };
    }
}