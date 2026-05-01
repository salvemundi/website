import { type User } from "better-auth";
import { type UserPermissions, type Committee } from "@/shared/lib/permissions";

export type EnrichedUser = User & UserPermissions & {
    id: string;
    email: string;
    name?: string | null;
    committees?: Committee[];
    membership_status?: string | null;
    membership_expiry?: string | null;
    minecraft_username?: string | null;
    phone_number?: string | null;
    date_of_birth?: string | null;
    entra_id?: string | null;
    isICT?: boolean;
};

export interface ImpersonationInfo {
    id: string;
    name: string;
    email: string;
    isNormallyAdmin: boolean;
    targetName?: string;
    targetCommittees?: string[];
}
