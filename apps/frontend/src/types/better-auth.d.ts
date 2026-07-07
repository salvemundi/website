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

        // Permissies
        permissions?: string[];
    }
}
