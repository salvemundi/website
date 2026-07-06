import type { Session, User } from "better-auth";
import { type Committee } from "@/shared/lib/permissions";

export type ExtendedUser = User & {
    first_name?: string;
    last_name?: string;
    membership_status?: string;
    membership_expiry?: string;
    phone_number?: string;
    date_of_birth?: string;
    avatar?: string;
    minecraft_username?: string;
    entra_id?: string;
    role?: string;
    committees?: Committee[];
    id: string;
    email: string;
    name?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
};

export interface ExtendedSession {
    user: ExtendedUser;
    session: Session;
    impersonatedBy?: {
        id: string;
        name: string;
        email: string;
        isNormallyAdmin: boolean;
    };
}

export interface AuthContext {
    path?: string;
    headers?: HeadersInit | Record<string, string>;
    request?: Request | { headers: HeadersInit | Record<string, string> };
    context?: {
        returned?: unknown;
    };
    response?: unknown;
}
