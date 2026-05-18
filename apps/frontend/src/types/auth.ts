import { type User, type Session } from "better-auth";
import { type UserPermissions, type Committee } from "@/shared/lib/permissions";

export type EnrichedUser = User & Partial<UserPermissions> & {
    id: string;
    name: string;
    committees?: Committee[];
    membership_status?: string | null;
    membership_expiry?: string | null;
    minecraft_username?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    entra_id?: string | null;
    isICT?: boolean;
    impersonated?: boolean;
};

export interface ImpersonationInfo {
    id: string;
    name: string;
    email: string;
    isNormallyAdmin: boolean;
    targetName?: string;
    targetCommittees?: string[];
}

export interface ExtendedSession {
    user: EnrichedUser;
    session: Session;
    impersonatedBy?: ImpersonationInfo;
}
