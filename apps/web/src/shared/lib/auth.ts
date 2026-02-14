import { directusUrl } from './directus';
import { User, SignupData } from '@/shared/model/types/auth'; // Removed EventSignup since it's only used in orphan code
import {
    registerUserAction,
    getUserCommitteesAction,
    getSafeHavenByUserIdAction
} from '@/shared/api/data-actions';

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    expires: number;
    user: User;
}

async function mapDirectusUserToUser(rawUser: any): Promise<User> {
    if (!rawUser || !rawUser.id) {
        throw new Error('Invalid user data received from Directus');
    }

    // Debug logging removed: sensitive user data should not be printed to console
    // Priority:
    // 1. Use explicit `membership_status` if present ('active'|'expired'|'none')
    // 2. If not present, use `membership_expiry` to infer active/expired
    // 3. Fallback to heuristics (entra_id or fontys_email) to consider user active
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

    let isSafeHaven = false;
    // Check if user is a safe haven by querying safe_havens collection
    if (rawUser.id) {
        const safeHaven = await getSafeHavenByUserIdAction(rawUser.id);
        isSafeHaven = !!safeHaven;
    }

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
        // Normalize avatar to a file id string when Directus returns an object
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

// Login with email and password (for non-members)
export async function loginWithPassword(email: string, password: string): Promise<LoginResponse> {
    try {
        const response = await fetch(`${directusUrl}/directus-auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            const errorMsg = errorData.errors?.[0]?.message || errorData.message || 'Invalid user credentials.';

            // Provide helpful error messages
            if (response.status === 401) {
                if (errorMsg.includes('Invalid user credentials')) {
                    throw new Error('Email or password is incorrect. If you signed up with Microsoft, please use "Login with Microsoft" instead.');
                }
            }

            throw new Error(errorMsg);
        }

        const data = await response.json();

        // Directus wraps the response in a 'data' object
        const authData = data.data || data;

        // Try to use user data from login response first, fallback to fetching
        let userDetails: User;

        if (authData.user && authData.user.id) {
            // Use user data from login response enriched with membership info
            userDetails = await mapDirectusUserToUser(authData.user);
        } else {
            // Fallback: Fetch user details
            const fetched = await fetchUserDetails(authData.access_token);
            if (!fetched) {
                throw new Error('Failed to fetch user details after login');
            }
            userDetails = fetched;
        }

        return {
            access_token: authData.access_token,
            refresh_token: authData.refresh_token,
            expires: authData.expires,
            user: userDetails,
        };
    } catch (error) {
        // console.error('Login error:', error);
        throw error;
    }
}

// Login with Microsoft Entra ID
export async function loginWithEntraId(entraIdToken: string, userEmail: string): Promise<LoginResponse> {
    try {
        // This endpoint should be created on your Directus backend
        // It will verify the Entra ID token and match it with the user's entra_id field
        const response = await fetch(`${directusUrl}/directus-extension-entra-auth/auth/login/entra`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                token: entraIdToken,
                email: userEmail,
            }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => null);
            throw new Error(errorBody?.error || errorBody?.errors?.[0]?.message || 'Microsoft login failed');
        }

        const raw = await response.json();

        // Support multiple shapes: { access_token, ... } OR { data: { access_token, ... } } OR { data: { data: { ... } } }
        const payload = raw?.data?.data || raw?.data || raw;

        // Validate we actually received an access token
        if (!payload || !payload.access_token) {
            throw new Error('Microsoft login failed: no access token returned from backend');
        }

        let enrichedUser: User | null = null;
        try {
            enrichedUser = await fetchUserDetails(payload.access_token);
        } catch (error) {
            // failed to refresh user details after Entra login
        }

        const userDetails = enrichedUser
            ? enrichedUser
            : await mapDirectusUserToUser(payload.user || payload);

        return {
            access_token: payload.access_token,
            refresh_token: payload.refresh_token,
            expires: payload.expires,
            user: userDetails,
        };
    } catch (error: unknown) {
        // console.error('Entra ID login error:', error);
        throw error;
    }
}

// Signup for non-members
export async function signupWithPassword(userData: SignupData): Promise<LoginResponse> {
    try {
        // Create the Directus user via Server Action (uses Admin Token)
        await registerUserAction({
            email: userData.email,
            password: userData.password,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone_number: userData.phone_number,
        });

        // Now login with the new credentials
        return await loginWithPassword(userData.email, userData.password);
    } catch (error: unknown) {
        // console.error('❌ Signup error:', error);

        const errMsg = error instanceof Error ? error.message : String(error);

        // Check for duplicate email error
        if (errMsg.includes('unique') || errMsg.includes('duplicate') || errMsg.includes('already exists')) {
            throw new Error('This email address is already registered. Please login instead or use a different email.');
        }

        // Check for specific Directus error codes
        if (errMsg.includes('RECORD_NOT_UNIQUE')) {
            throw new Error('This email address is already registered. Please login instead or use a different email.');
        }

        throw error;
    }
}

// Fetch current user details
export async function fetchUserDetails(token: string): Promise<User | null> {
    try {
        // No development mock - require real token and backend response

        // We use native fetch here instead of directusFetch to:
        // 1. Avoid interference from directusFetch's automatic token logic (localStorage fallback)
        // 2. Pass the token via query param to bypass potential header stripping in the network layer/middleware
        // The Proxy (route.ts) will detect this query param, convert it to an Authorization header, 
        // and remove it from the URL before forwarding to Directus.
        const response = await fetch(`${directusUrl}/users/me?fields=*,membership_expiry,membership_status,entra_id,date_of_birth&access_token=${token}`, {
            headers: {
                'Content-Type': 'application/json',
                // Explicitly set cache-control to ensure we get fresh data
                'Cache-Control': 'no-cache'
            },
        });

        if (!response.ok) {
            // If 401 or similar, the token is invalid
            // console.warn('[fetchUserDetails] Token validation failed:', response.status);
            return null;
        }

        const data = await response.json();
        // Directus returns { data: ... }
        const rawUser = data.data || data;

        if (!rawUser) {
            return null;
        }

        // Don't try to map committees here - they should be fetched separately
        // via the committee_members junction table using a dedicated query
        // Set committees to empty array as it will be populated by the blog page query
        const user = { ...rawUser, committees: [] };

        return await mapDirectusUserToUser(user);

    } catch {
        // If we get an error, it might be an expired token which directusFetch already handled
        // or a real network error.
        // console.error('Failed to fetch user details:', error);
        return null; // Return null instead of throwing to allow AuthProvider to try other recovery methods
    }
}

// Fetch committees (commissions) that a user belongs to and persist to localStorage
export async function fetchAndPersistUserCommittees(userId: string): Promise<Array<{ id: string; name: string }>> {
    try {
        // Build a query to get committee info via committee_members relation
        // We prefer using the Directus JWT when available for private collections
        // Also fetch is_visible to filter out hidden committees
        const rows = await getUserCommitteesAction(userId);

        const committees: Array<{ id: string; name: string; is_leader?: boolean }> = [];
        for (const r of rows) {
            const c = r?.committee_id;
            // Only include visible committees (is_visible !== false)
            if (c && c.id && c.is_visible !== false) {
                const id = String(c.id);
                const name = String(c.name || '');
                const isLeader = !!r?.is_leader;
                if (!committees.find((x) => x.id === id)) committees.push({ id, name, is_leader: isLeader });
            }
        }

        // Persist under a per-user key
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(`user_committees_${userId}`, JSON.stringify(committees));
            }
        } catch (e) {
            // ignore storage errors
        }

        return committees;

    } catch {
        // console.error('Failed to fetch/persist user committees:', error);
        return [];
    }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
    try {
        const response = await fetch(`${directusUrl}/directus-auth/refresh`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
                mode: 'json',
            }),
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        const userDetails = await fetchUserDetails(data.data.access_token);
        if (!userDetails) {
            throw new Error('Failed to fetch user details after token refresh');
        }

        return {
            access_token: data.data.access_token,
            refresh_token: data.data.refresh_token,
            expires: data.data.expires,
            user: userDetails,
        };
    } catch (error) {
        // console.error('Token refresh error:', error);
        throw error;
    }
}

// Logout
export async function logout(refreshToken: string): Promise<void> {
    try {
        await fetch(`${directusUrl}/directus-auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refresh_token: refreshToken,
            }),
        });

    } catch {
        // console.error('Logout error:', error);
        // Don't throw - logout should succeed even if API call fails
    }
}
