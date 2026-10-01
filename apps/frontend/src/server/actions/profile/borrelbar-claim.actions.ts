'use server';

import { getEnrichedSession } from '@/server/auth/auth-utils';
import { db, schema } from '@salvemundi/db';
import { eq } from 'drizzle-orm';
import { safeConsoleError } from '@/server/utils/logger';

export interface BorrelBarClaimStatus {
    hasClaimed: boolean;
    claimedAt: string | null;
    isActive: boolean;
    logoImageId?: string | null;
    passUrl?: string | null;
}

export interface BorrelBarClaimResult {
    success: boolean;
    passUrl?: string | null;
    error?: string;
}

async function getBorrelBarSettings(): Promise<{ claim_url: string | null; is_active: boolean }> {
    const settings = await db.query.borrelbar_settings.findFirst();
    return {
        claim_url: settings?.claim_url ?? null,
        is_active: settings?.is_active ?? false,
    };
}

export async function getBorrelBarClaimStatus(): Promise<BorrelBarClaimStatus> {
    try {
        const [session, settings, sponsor] = await Promise.all([
            getEnrichedSession(),
            getBorrelBarSettings(),
            db.query.sponsors.findFirst({
                where: eq(schema.sponsors.sponsor_id, 5)
            })
        ]);

        const logoImageId = sponsor?.image ?? null;

        if (!settings.is_active) {
            return { hasClaimed: false, claimedAt: null, isActive: false, logoImageId, passUrl: null };
        }

        const userId = session?.user.id;
        if (!userId) {
            return { hasClaimed: false, claimedAt: null, isActive: true, logoImageId, passUrl: null };
        }

        const userClaim = await db.query.borrelbar_claims.findFirst({
            where: eq(schema.borrelbar_claims.user_id, userId)
        });

        return {
            hasClaimed: !!userClaim,
            claimedAt: userClaim?.claimed_at ?? null,
            isActive: true,
            logoImageId,
            passUrl: userClaim?.pass_url ?? null
        };
    } catch (error) {
        safeConsoleError('[borrelbar-claim.actions.ts][getBorrelBarClaimStatus]', error);
        return { hasClaimed: false, claimedAt: null, isActive: false, logoImageId: null, passUrl: null };
    }
}

export async function claimBorrelBarLink(): Promise<BorrelBarClaimResult> {
    try {
        const [session, settings] = await Promise.all([
            getEnrichedSession(),
            getBorrelBarSettings()
        ]);

        const user = session?.user;
        if (!user) {
            return { success: false, error: 'Je moet ingelogd zijn om deze claim te doen.' };
        }

        const userId = user.id;

        if (!settings.is_active) {
            return { success: false, error: 'Deze actie is momenteel niet actief.' };
        }

        if (!settings.claim_url) {
            return { success: false, error: 'De claim link is momenteel niet beschikbaar.' };
        }

        const existingClaim = await db.query.borrelbar_claims.findFirst({
            where: eq(schema.borrelbar_claims.user_id, userId)
        });

        if (existingClaim) {
            return { success: true, passUrl: existingClaim.pass_url };
        }

        const dbUser = await db.query.directus_users.findFirst({
            where: eq(schema.directus_users.id, userId),
            columns: {
                first_name: true,
                last_name: true,
                email: true
            }
        });

        const firstName = dbUser?.first_name?.trim() || '';
        const lastName = dbUser?.last_name?.trim() || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const email = dbUser?.email?.trim() || (user.email ? user.email.trim() : '');

        if (!firstName || !fullName) {
            return { success: false, error: 'Je profielnaam is niet compleet ingevuld. Vul eerst je voor- en achternaam in op je profiel.' };
        }

        if (!email) {
            return { success: false, error: 'Geen geldig e-mailadres gevonden voor dit account.' };
        }

        const match = settings.claim_url.match(/pass\/activation\/([a-zA-Z0-9_-]+)/i);
        const quizId = match ? match[1] : null;

        let passUrl: string | null = null;

        if (quizId) {
            try {
                const onmeResponse = await fetch('https://api.onme.nl/quiz/public/quiz/submit', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                        Origin: 'https://portal.onme.nl',
                        Referer: `https://portal.onme.nl/pass/activation/${quizId}`,
                    },
                    body: JSON.stringify({
                        quizId,
                        responder: {
                            firstName: fullName,
                            email,
                            consentPrivacyPolicy: true,
                        },
                        submission: {},
                    }),
                });

                if (onmeResponse.ok) {
                    const data = (await onmeResponse.json()) as { passHolderId?: string };
                    if (data.passHolderId) {
                        passUrl = `https://portal.onme.nl/pass/acquisition/${quizId}/${data.passHolderId}`;
                    }
                } else {
                    const errorText = await onmeResponse.text();
                    safeConsoleError(`[BorrelBar Claim] OnMe submit responded with status ${onmeResponse.status}: ${errorText}`);
                }
            } catch (err) {
                safeConsoleError('[borrelbar-claim.actions.ts][onmeSubmit]', err);
            }
        }

        await db.insert(schema.borrelbar_claims).values({
            user_id: userId,
            claimed_at: new Date().toISOString(),
            pass_url: passUrl
        });

        return { success: true, passUrl };
    } catch (error) {
        safeConsoleError('[borrelbar-claim.actions.ts][claimBorrelBarLink]', error);
        return { success: false, error: 'Er is een fout opgetreden bij het registreren van de claim.' };
    }
}
