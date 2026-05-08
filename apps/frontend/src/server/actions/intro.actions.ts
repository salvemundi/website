'use server';

import { 
    introSignupFormSchema, 
    introParentSignupFormSchema, 
    type IntroSignupForm, 
    type IntroParentSignupForm
} from '@salvemundi/validations/schema/intro.zod';
import { 
    FEATURE_FLAG_FIELDS, 
    INTRO_PARENT_SIGNUP_FIELDS 
} from '@salvemundi/validations/directus/fields';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem, updateItem } from '@directus/sdk';
import { query } from '@/lib/database';
import { cacheLife, revalidateTag, revalidatePath, unstable_noStore as noStore } from 'next/cache';
import { normalizeDate } from '@/lib/utils/date-utils';

const getMailUrl = () => process.env.MAIL_SERVICE_URL;

const getServiceHeaders = (): HeadersInit => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export async function getIntroSettings() {
    'use cache';
    cacheLife('minutes');
    try {
        const { rows } = await query('SELECT is_active, message FROM feature_flags WHERE route_match = $1 LIMIT 1', ['/intro']);
        const data = rows?.[0];

        return {
            show: data?.is_active ?? false,
            disabled_message: data?.message ?? 'De inschrijvingen voor de introweek zijn momenteel gesloten.',
        };
    } catch (e) {
        
        return { show: false, disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' };
    }
}

export async function hasParentSignup(): Promise<boolean> {
    const check = await checkParentSignupInternal();
    return check.exists;
}

async function checkParentSignupInternal(): Promise<{ exists: boolean; record?: { id: number; user_id: string | null; email: string | null } }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) return { exists: false };

    try {
        // 1. Primary check: Strict User ID match
        const signups = await getSystemDirectus().request(
            readItems('intro_parent_signups', {
                filter: { user_id: { _eq: session.user.id } },
                fields: ['id', 'user_id', 'email'],
                limit: 1
            })
        );

        if (signups.length > 0) {
            return { exists: true, record: signups[0] as any };
        }

        // 2. Fallback check: Email match (legacy or ID change)
        const emailSignups = await getSystemDirectus().request(
            readItems('intro_parent_signups', {
                filter: { email: { _eq: session.user.email } },
                fields: ['id', 'user_id', 'email'],
                limit: 1
            })
        );

        if (emailSignups.length > 0) {
            const record = emailSignups[0] as any;
            console.warn(`[hasParentSignup] ID Mismatch! Email ${session.user.email} matched ID ${record.user_id}, but session is ${session.user.id}.`);
            return { exists: true, record };
        }

        return { exists: false };
    } catch (e) {
        console.error('[hasParentSignup] Directus check failed:', e);
        return { exists: false };
    }
}

export async function submitIntroSignup(data: IntroSignupForm): Promise<{ success: boolean; error?: string }> {
    // Normalize date before validation
    data.geboortedatum = normalizeDate(data.geboortedatum) as string;
    
    const parsed = introSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('intro-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.' };
    }

    // Bot detection (honeypot)
    if (parsed.data.website) {
        return { success: true };
    }

    const payload = {
        first_name: parsed.data.voornaam,
        last_name: `${parsed.data.tussenvoegsel ? parsed.data.tussenvoegsel + ' ' : ''}${parsed.data.achternaam}`.trim(),
        date_of_birth: parsed.data.geboortedatum,
        email: parsed.data.email,
        phone_number: parsed.data.telefoonnummer,
        favorite_gif: parsed.data.favorieteGif || null,
    };

    try {
        await getSystemDirectus().request(createItem('intro_signups', payload));
    } catch (e) {
        
        throw new Error('Er is een fout opgetreden bij je inschrijving');
    }

    // Trigger Mail Microservice asynchronously
    fetch(`${getMailUrl()}/api/mail/send`, {
        method: 'POST',
        headers: getServiceHeaders(),
        body: JSON.stringify({
            templateId: 'intro-signup',
            to: payload.email,
            data: {
                firstName: payload.first_name,
                lastName: payload.last_name,
                phone: payload.phone_number,
            }
        })
    }).catch(() => {});
    return { success: true };
}

export async function getIntroBlogsPublic() {
    'use cache';
    cacheLife('minutes');
    try {
        const sql = 'SELECT * FROM intro_blogs WHERE is_published = true ORDER BY id DESC LIMIT 6';
        const { rows } = await query(sql);
        return rows;
    } catch (e) {
        return [];
    }
}

export async function getAllIntroBlogsPublic() {
    'use cache';
    cacheLife('minutes');
    try {
        const sql = 'SELECT * FROM intro_blogs WHERE is_published = true ORDER BY id DESC';
        const { rows } = await query(sql);
        return rows;
    } catch (e) {
        return [];
    }
}

export async function getIntroBlogBySlug(slug: string) {
    'use cache';
    cacheLife('minutes');
    try {
        const sql = 'SELECT * FROM intro_blogs WHERE slug = $1 AND is_published = true LIMIT 1';
        const { rows } = await query(sql, [slug]);
        return rows[0] || null;
    } catch (e) {
        return null;
    }
}

export async function submitIntroParentSignup(data: IntroParentSignupForm): Promise<{ success: boolean; error?: string }> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        return { success: false, error: 'Je moet ingelogd zijn als lid om je aan te melden als Intro Ouder' };
    }

    // Prevents unique constraint error and ensures data integrity (linking)
    const check = await checkParentSignupInternal();
    if (check.exists && check.record) {
        // If it matched by email but not ID, fix the integrity by updating the ID
        if (check.record.user_id !== session.user.id) {
            console.log(`[IntroParentSignup] Fixing Data Integrity: Linking email ${session.user.email} to current User ID ${session.user.id}`);
            try {
                await getSystemDirectus().request(updateItem('intro_parent_signups', check.record.id, {
                    user_id: session.user.id
                }));
            } catch (e) {
                console.error('[IntroParentSignup] Failed to fix User ID link:', e);
            }
        }
        return { success: true };
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('intro-parent-signup', 3, 300);
    if (!success) {
        return { success: false, error: 'Te veel aanmeldingen. Probeer het over een paar minuten opnieuw.' };
    }

    const parsed = introParentSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        return { success: false, error: 'Validatie mislukt' };
    }
    const payload = {
        user_id: session.user.id,
        first_name: session.user.name?.split(' ')[0] || session.user.name,
        last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email,
        phone_number: parsed.data.telefoonnummer,
        motivation: parsed.data.motivation,
        availability: []
    };

    try {
        console.log('[IntroParentSignup] Payload:', JSON.stringify(payload, null, 2));
        const result = await getSystemDirectus().request(createItem('intro_parent_signups', payload));
        console.log('[IntroParentSignup] Success:', result);
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e: any) {
        console.error('[IntroParentSignup] Error details:', {
            message: e.message,
            status: e.status,
            code: e.code,
            response: e.response?.data || e.response
        });
        throw new Error(`Er is een fout opgetreden tijdens de intro-ouder inschrijving: ${e.message || 'Onbekende fout'}`);
    }
}


