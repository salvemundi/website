'use server';

import { introSignupFormSchema, introParentSignupFormSchema, type IntroSignupForm, type IntroParentSignupForm } from '@salvemundi/validations';
import { auth } from '@/server/auth/auth';
import { headers } from 'next/headers';

const getDirectusUrl = () => process.env.INTERNAL_DIRECTUS_URL || 'http://v7-core-directus:8055';
const getMailUrl = () => process.env.INTERNAL_MAIL_URL || 'http://v7-acc-mail-service:3003';

const getDirectusHeaders = (): HeadersInit => {
    const token = process.env.DIRECTUS_STATIC_TOKEN;
    if (!token) throw new Error('DIRECTUS_STATIC_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

const getServiceHeaders = (): HeadersInit => {
    const token = process.env.INTERNAL_SERVICE_TOKEN;
    if (!token) throw new Error('INTERNAL_SERVICE_TOKEN is missing');
    return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
};

export async function getIntroSettings() {
    const url = `${getDirectusUrl()}/items/site_settings?filter[id][_eq]=intro`;

    try {
        const res = await fetch(url, {
            headers: getDirectusHeaders(),
            next: { tags: ['site_settings', 'intro_settings'] },
        });

        if (!res.ok) {
            return { show: false, disabled_message: 'De inschrijvingen voor de introweek zijn momenteel gesloten.' };
        }

        const json = await res.json();
        const data = json.data?.[0];

        return {
            show: data?.show ?? false,
            disabled_message: data?.disabled_message ?? 'De inschrijvingen voor de introweek zijn momenteel gesloten.',
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
        const res = await fetch(`${getDirectusUrl()}/items/intro_parent_signups?filter[user_id][_eq]=${session.user.id}`, {
            headers: getDirectusHeaders(),
        });

        if (!res.ok) return false;

        const json = await res.json();
        return Array.isArray(json.data) && json.data.length > 0;
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
        console.log('[IntroAction] Bot detected via honeypot');
        return { success: true };
    }

    const payload = {
        first_name: parsed.data.voornaam,
        middle_name: parsed.data.tussenvoegsel || null,
        last_name: parsed.data.achternaam,
        date_of_birth: parsed.data.geboortedatum,
        email: parsed.data.email,
        phone_number: parsed.data.telefoonnummer,
        favorite_gif: parsed.data.favorieteGif || null,
    };

    const res = await fetch(`${getDirectusUrl()}/items/intro_signups`, {
        method: 'POST',
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        console.error('[IntroAction] Mislukt bij Directus creatie:', await res.text());
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

    const parsed = introParentSignupFormSchema.safeParse(data);
    if (!parsed.success) {
        throw new Error('Validatie mislukt');
    }

    // Aanname: de user object structuur heeft name
    const payload = {
        user_id: session.user.id,
        first_name: session.user.name?.split(' ')[0] || session.user.name,
        last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email,
        phone_number: parsed.data.telefoonnummer,
        motivation: parsed.data.motivation,
        availability: []
    };

    const res = await fetch(`${getDirectusUrl()}/items/intro_parent_signups`, {
        method: 'POST',
        headers: getDirectusHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        console.error('[IntroParentAction] Mislukt:', await res.text());
        throw new Error('Er is een fout opgetreden tijdens de intro-ouder inschrijving');
    }

    return { success: true };
}
