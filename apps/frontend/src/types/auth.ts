import { type User, type Session } from "better-auth";
import { type DirectusUser } from "@salvemundi/validations";
import { type Committee } from "@/shared/lib/permissions";

export type DirectusProfileFields = Pick<
    DirectusUser,
    | 'first_name'
    | 'last_name'
    | 'fontys_email'
    | 'membership_status'
    | 'membership_expiry'
    | 'phone_number'
    | 'date_of_birth'
    | 'avatar'
    | 'minecraft_username'
    | 'entra_id'
    | 'location'
    | 'title'
    | 'description'
>;

export type EnrichedUser = Partial<DirectusProfileFields> & Omit<User, 'image'> & {
    id: string;
    name: string;
    image?: string | null;
    committees?: Committee[];
    permissions?: string[];
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
