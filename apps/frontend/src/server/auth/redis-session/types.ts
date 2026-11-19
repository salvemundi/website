import type { EnrichedUser, ExtendedSession } from "@/types/auth";

export type ExtendedUser = EnrichedUser;
export type { ExtendedSession };

export interface AuthContext {
    path?: string;
    headers?: HeadersInit | Record<string, string>;
    request?: Request | { headers: HeadersInit | Record<string, string> };
    context?: {
        returned?: unknown;
    };
    response?: unknown;
}
