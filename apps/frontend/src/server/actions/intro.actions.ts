'use server';

import { 
    introSignupFormSchema, 
    introParentSignupFormSchema, 
    type IntroSignupForm, 
    type IntroParentSignupForm,
    FEATURE_FLAG_FIELDS, 
    INTRO_PARENT_SIGNUP_FIELDS 
} from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

import { getSystemDirectus } from '@/lib/directus';
import { readItems, createItem } from '@directus/sdk';
import { revalidatePath } from 'next/cache';

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
    try {
        const items = await getSystemDirectus().request(readItems('feature_flags', {
            filter: { route_match: { _eq: '/intro' } },
            fields: [...FEATURE_FLAG_FIELDS],
            limit: 1
        }));

        const data = items?.[0];

        return {
            show: data?.is_active ?? false,
            disabled_message: data?.message ?? 'De inschrijvingen voor de introweek zijn momenteel gesloten.',
        };
    } catch {
        return { show: false, disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' };
    }
}

export async function hasParentSignup(): Promise<boolean> {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) return false;

    try {
        const items = await getSystemDirectus().request(readItems('intro_parent_signups' as any, {
            filter: { user_id: { _eq: session.user.id } },
            fields: [...INTRO_PARENT_SIGNUP_FIELDS]
        }));

        return Array.isArray(items) && items.length > 0;
    } catch {
        return false;
    }
}

export async function submitIntroSignup(data: IntroSignupForm) {
    const parsed = introSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Validatie mislukt');
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('intro-signup', 3, 300);
    if (!success) {
        throw new Error('Te veel aanmeldingen vanaf dit IP-adres. Probeer het later opnieuw.');
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
        await getSystemDirectus().request(createItem('intro_signups' as any, payload as any));
    } catch (e) {
        console.error('[IntroAction] Failed in Directus creation:', e);
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
    }).catch(e => console.error('[IntroAction] Mail trigger proxy failed', e));

    return { success: true };
}

export async function submitIntroParentSignup(data: IntroParentSignupForm) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session?.user) {
        throw new Error('Je moet ingelogd zijn als lid om je aan te melden als Intro Ouder');
    }

    const { rateLimit } = await import('../utils/ratelimit');
    const { success } = await rateLimit('intro-parent-signup', 3, 300);
    if (!success) {
        throw new Error('Te veel aanmeldingen. Probeer het over een paar minuten opnieuw.');
    }

    const parsed = introParentSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Validatie mislukt');
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
        await getSystemDirectus().request(createItem('intro_parent_signups' as any, payload as any));
        revalidatePath('/beheer/intro');
        return { success: true };
    } catch (e) {
        console.error('[IntroParentAction] Failed:', e);
        throw new Error('Er is een fout opgetreden tijdens de intro-ouder inschrijving');
    }
}


