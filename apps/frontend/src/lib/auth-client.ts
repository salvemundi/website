import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
    // Geen baseURL — de browser leidt window.location.origin automatisch af.
    // Conform V7 Coding Guidelines: geen NEXT_PUBLIC_ variabelen voor auth.
});
