import { Pool } from "pg";
import { getRedis } from "@/server/auth/redis-client";
import { getPermissions, type Committee } from "@/shared/lib/permissions";
import { type ExtendedUser } from "./types";
import { safeConsoleError } from '@/server/utils/logger';
import { toLocalISOString } from "@/lib/utils/date-utils";

interface RawImpersonationDbUser {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar: string | null;
    membership_status: string | null;
    membership_expiry: string | Date | null;
    phone_number: string | null;
    date_of_birth: string | Date | null;
    minecraft_username: string | null;
    admin_access: boolean | null;
    role: string | null;
}

export async function getImpersonatedUser(testToken: string, _pool: Pool): Promise<ExtendedUser | null> {
    try {
        const redis = await getRedis();
        const directusUrl = process.env.DIRECTUS_SERVICE_URL;
        const cacheKey = `impersonation:${testToken}`;

        const cachedImp = await redis.get(cacheKey);
        if (cachedImp) {
            return JSON.parse(cachedImp) as ExtendedUser;
        }

        if (!directusUrl) return null;

        const response = await fetch(`${directusUrl}/users/me?fields=id`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${testToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) return null;

        const json = await response.json() as { data: { id: string } };
        const rawImpUser = json.data;

        if (!rawImpUser.id) return null;

        const { db, schema } = await import("@salvemundi/db");
        const { eq } = await import("drizzle-orm");

        const dbUsers = await db.select({
            id: schema.directus_users.id,
            first_name: schema.directus_users.first_name,
            last_name: schema.directus_users.last_name,
            email: schema.directus_users.email,
            avatar: schema.directus_users.avatar,
            membership_status: schema.directus_users.membership_status,
            membership_expiry: schema.directus_users.membership_expiry,
            phone_number: schema.directus_users.phone_number,
            date_of_birth: schema.directus_users.date_of_birth,
            minecraft_username: schema.directus_users.minecraft_username,
            admin_access: schema.directus_users.admin_access,
            role: schema.directus_users.role
        }).from(schema.directus_users).where(eq(schema.directus_users.id, rawImpUser.id)).limit(1);

        if (dbUsers.length === 0) return null;

        const dbUser = dbUsers[0] as RawImpersonationDbUser;
        const impCommittees = await db.select({
            id: schema.committees.id,
            name: schema.committees.name,
            azure_group_id: schema.committees.azure_group_id,
            is_leader: schema.committee_members.is_leader
        })
        .from(schema.committee_members)
        .innerJoin(schema.committees, eq(schema.committee_members.committee_id, schema.committees.id))
        .where(eq(schema.committee_members.user_id, dbUser.id));

        const typedCommittees = impCommittees as unknown as Committee[];
        const perms = getPermissions(typedCommittees);

        const targetUser: ExtendedUser = {
            id: dbUser.id,
            first_name: dbUser.first_name || undefined,
            last_name: dbUser.last_name || undefined,
            name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
            email: dbUser.email,
            avatar: dbUser.avatar || undefined,
            membership_status: dbUser.membership_status || undefined,
            membership_expiry: toLocalISOString(dbUser.membership_expiry) || undefined,
            phone_number: dbUser.phone_number || undefined,
            date_of_birth: toLocalISOString(dbUser.date_of_birth) || undefined,
            minecraft_username: dbUser.minecraft_username || undefined,
            role: dbUser.role || undefined,
            committees: typedCommittees,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...perms,
            isAdmin: !!dbUser.admin_access || perms.isAdmin
        };

        await redis.set(cacheKey, JSON.stringify(targetUser), 'EX', 300);
        return targetUser;
    } catch (error: unknown) {
        const typedError = error instanceof Error ? error : new Error(String(error));
        safeConsoleError('[impersonation.ts][getImpersonatedUser] ', `Impersonation Error: ${typedError.message}`);
        return null;
    }
}