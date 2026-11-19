import "better-auth";
import { type Committee } from "../shared/lib/permissions";
import { type DirectusProfileFields } from "./auth";

declare module "better-auth" {
    interface User extends Partial<DirectusProfileFields> {
        id: string;
        email: string;
        name: string;
        emailVerified: boolean;
        image?: string | null;
        createdAt: Date;
        updatedAt: Date;
        committees?: Committee[];
        role?: string | null;
        permissions?: string[];
    }
}
