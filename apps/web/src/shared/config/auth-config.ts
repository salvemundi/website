export const AUTH_COOKIES = {
    SESSION: 'directus_session_token',
    REFRESH: 'directus_refresh_token',
};

export const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
};
