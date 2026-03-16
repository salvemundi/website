import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // baseURL wordt automatisch afgeleid van window.location.origin in de browser.
    // Voor SSR/build-time fallback gebruiken we de env vars.
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || undefined,
});
