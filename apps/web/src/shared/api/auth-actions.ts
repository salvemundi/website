'use server';

import { serverDirectusFetch } from '@/shared/lib/server-directus';
import { User, SignupData } from '@/shared/model/types/auth';
import { cookies } from 'next/headers';
import { AUTH_COOKIES, AUTH_COOKIE_OPTIONS } from '@/shared/config/auth-config';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    expires: number;
    user: User;
}

export type LoginActionResult =
    | (LoginResponse & { success?: true })
    | { success: false; error: string };

// Logic replicated from auth.ts but safe for server-side execution
function mapDirectusUserToUser(rawUser: any): User {
    if (!rawUser || !rawUser.id) {
        throw new Error('Invalid user data received from Directus');
    }

    let membershipStatus: 'active' | 'expired' | 'none' = 'none';
    let isMember = false;

    if (
        rawUser.membership_status === 'active' ||
        rawUser.membership_status === 'expired' ||
        rawUser.membership_status === 'none'
    ) {
        membershipStatus = rawUser.membership_status;
        isMember = membershipStatus === 'active';
    } else if (rawUser.membership_expiry) {
        try {
            const expiry = new Date(rawUser.membership_expiry);
            if (!isNaN(expiry.getTime()) && expiry > new Date()) {
                membershipStatus = 'active';
                isMember = true;
            } else {
                membershipStatus = 'expired';
                isMember = false;
            }
        } catch (e) {
            membershipStatus = 'none';
            isMember = false;
        }
    } else {
        const fallbackMember = !!(rawUser.entra_id || rawUser.fontys_email);
        isMember = fallbackMember;
        membershipStatus = fallbackMember ? 'active' : 'none';
    }

    // Note: Safe Haven check skipped here as it requires additional queries that are expensive on login
    // The client can fetch enriched details later if needed.
    const isSafeHaven = false;

    return {
        id: rawUser.id,
        email: rawUser.email || '',
        first_name: rawUser.first_name || '',
        middle_name: rawUser.middle_name || rawUser.tussenvoegsel || undefined,
        last_name: rawUser.last_name || '',
        entra_id: rawUser.entra_id,
        fontys_email: rawUser.fontys_email,
        phone_number: rawUser.phone_number,
        date_of_birth: rawUser.date_of_birth,
        avatar: rawUser?.avatar && typeof rawUser.avatar === 'object' && 'id' in rawUser.avatar ? rawUser.avatar.id : rawUser.avatar,
        is_member: isMember,
        member_id: undefined,
        membership_status: membershipStatus,
        membership_expiry: rawUser.membership_expiry,
        minecraft_username: rawUser.minecraft_username,
        is_safe_haven: isSafeHaven,
        admin_access: rawUser.admin_access === true,
        role: rawUser.role,
    };
}

/**
 * Internal helper to fetch user details with a specific token
 */
async function fetchUserDetailsWithToken(accessToken: string): Promise<User> {
    const userResponse = await serverDirectusFetch<any>('/users/me?fields=*,membership_expiry,membership_status,entra_id,date_of_birth,avatar.id', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
        revalidate: 0
    });
    const rawUser = userResponse?.data || userResponse;
    return mapDirectusUserToUser(rawUser);
}

export async function loginWithEntraIdAction(entraIdToken: string, userEmail: string): Promise<LoginActionResult> {
    try {
        const response = await serverDirectusFetch<any>('/directus-extension-entra-auth/auth/login/entra', {
            method: 'POST',
            body: JSON.stringify({
                token: entraIdToken,
                email: userEmail,
            }),
            revalidate: 0
        });

        const payload = response?.data || response;

        if (!payload || !payload.access_token) {
            throw new Error('Microsoft login failed: no access token returned from backend');
        }

        // Fetch full user details using the NEW access_token
        const userDetails = await fetchUserDetailsWithToken(payload.access_token);

        // Set HTTP-only cookies for session management
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIES.SESSION, payload.access_token, {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: Math.floor(payload.expires / 1000) || 3600,
        });
        if (payload.refresh_token) {
            cookieStore.set(AUTH_COOKIES.REFRESH, payload.refresh_token, {
                ...AUTH_COOKIE_OPTIONS,
                maxAge: 30 * 24 * 60 * 60,
            });
        }

        return {
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires: payload.expires,
            user: userDetails,
        };

    } catch (error: any) {
        console.error('[auth-actions] Entra Login Error:', error.message || error);

        return {
            success: false,
            error: 'Sessie is verlopen of ongeldig. Log opnieuw in.'
        };
    }
}

export async function loginWithPasswordAction(email: string, password: string): Promise<LoginResponse> {
    try {
        const response = await serverDirectusFetch<any>('/directus-auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            revalidate: 0
        });

        // Response handling is similar to Entra ID
        const payload = response?.data || response;

        if (!payload || !payload.access_token) {
            throw new Error('Login failed: no access token returned');
        }

        const userDetails = await fetchUserDetailsWithToken(payload.access_token);

        // Set HTTP-only cookies for session management
        const cookieStore = await cookies();
        cookieStore.set(AUTH_COOKIES.SESSION, payload.access_token, {
            ...AUTH_COOKIE_OPTIONS,
            maxAge: Math.floor(payload.expires / 1000) || 3600,
        });
        if (payload.refresh_token) {
            cookieStore.set(AUTH_COOKIES.REFRESH, payload.refresh_token, {
                ...AUTH_COOKIE_OPTIONS,
                maxAge: 30 * 24 * 60 * 60,
            });
        }

        return {
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires: payload.expires,
            user: userDetails,
        };
    } catch {
        throw new Error('Email of wachtwoord is onjuist.');
    }
}


export async function signupWithPasswordAction(userData: SignupData): Promise<LoginResponse> {
    try {
        const roleId = process.env.NEXT_PUBLIC_DEFAULT_USER_ROLE_ID || process.env.DEFAULT_USER_ROLE_ID;

        // Create the user using admin privileges (serverDirectusFetch uses admin token)
        await serverDirectusFetch<any>('/users', {
            method: 'POST',
            body: JSON.stringify({
                email: userData.email,
                password: userData.password,
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone_number: userData.phone_number,
                role: roleId || null,
                status: 'active',
            }),
            revalidate: 0
        });

        // Automatically login
        return await loginWithPasswordAction(userData.email, userData.password);

    } catch (error: any) {
        console.error('[signupWithPasswordAction] Error:', error);
        const errMsg = error instanceof Error ? error.message : String(error);

        if (errMsg.includes('unique') || errMsg.includes('duplicate') || errMsg.includes('already exists') || errMsg.includes('RECORD_NOT_UNIQUE')) {
            throw new Error('Dit emailadres is al geregistreerd. Log in of gebruik een ander emailadres.');
        }

        throw new Error('Registratie mislukt. Controleer je gegevens.');
    }
}

/**
 * getCurrentUserAction - Securely retrieves the current user session from cookies.
 * This replaces the need for the client to store and send tokens manually.
 */
export async function getCurrentUserAction(): Promise<User | null> {
    try {
        const cookieStore = await cookies();
        const sessionToken = cookieStore.get(AUTH_COOKIES.SESSION)?.value;

        if (!sessionToken) return null;

        // Verify token with Directus and fetch fresh user details
        const response = await serverDirectusFetch<any>('/users/me?fields=*,membership_expiry,membership_status,entra_id,date_of_birth', {
            headers: {
                'Authorization': `Bearer ${sessionToken}`,
            },
            revalidate: 0 // Fetch fresh user data
        });

        const rawUser = response?.data || response;
        if (!rawUser?.id) return null;

        return mapDirectusUserToUser(rawUser);
    } catch (error) {
        // Token might be expired. Refresh logic could be added here or handled by the client
        // calling a separate refresh action.
        return null;
    }
}

/**
 * logoutAction - Clears authentication cookies.
 */
export async function logoutAction(): Promise<void> {
    const cookieStore = await cookies();

    // Optional: Call Directus logout if we have a refresh token
    const refreshToken = cookieStore.get(AUTH_COOKIES.REFRESH)?.value;
    if (refreshToken) {
        try {
            await serverDirectusFetch('/auth/logout', {
                method: 'POST',
                body: JSON.stringify({ refresh_token: refreshToken }),
            });
        } catch (e) {
            // ignore backend logout failure
        }
    }

    cookieStore.delete(AUTH_COOKIES.SESSION);
    cookieStore.delete(AUTH_COOKIES.REFRESH);
}
