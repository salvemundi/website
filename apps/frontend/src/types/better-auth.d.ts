import "better-auth";
import { type Committee } from "../shared/lib/permissions";

declare module "better-auth" {
    interface User {
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
    }
    interface Session {
        user: User;
    }
}
