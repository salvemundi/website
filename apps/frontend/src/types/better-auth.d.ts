import "better-auth";
import { type Committee } from "../shared/lib/permissions";

declare module "better-auth" {
    interface User {
        // Standaard velden
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;

        // Custom velden
        first_name?: string | null;
        last_name?: string | null;
        membership_status?: string | null;
        membership_expiry?: string | null;
        phone_number?: string | null;
        date_of_birth?: string | null;
        avatar?: string | null;
        minecraft_username?: string | null;
        committees?: Committee[];
        entra_id?: string | null;
        role?: string | null;
        isAdmin?: boolean;
        isICT?: boolean;

        // Permissies (UserPermissions)
        isLeader?: boolean;
        canAccessIntro?: boolean;
        canAccessReis?: boolean;
        canAccessLogging?: boolean;
        canAccessSync?: boolean;
        canAccessCoupons?: boolean;
        canAccessPermissions?: boolean;
        canAccessStickers?: boolean;
        canAccessKroegentocht?: boolean;
        canAccessMembers?: boolean;
        canAccessCommittees?: boolean;
        canAccessActivitiesView?: boolean;
        canAccessActivitiesEdit?: boolean;
        canAccessMail?: boolean;
    }
}
