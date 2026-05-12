import { Pool } from "pg";
import { getRedis } from "@/server/auth/redis-client";
import { getPermissions } from "@/shared/lib/permissions";
import { type ExtendedUser } from "./types";

export async function getImpersonatedUser(testToken: string, pool: Pool): Promise<ExtendedUser | null> {
    try {
        const redis = await getRedis();
        const directusUrl = process.env.DIRECTUS_SERVICE_URL;
        const cacheKey = `impersonation:${testToken}`;

        const cachedImp = await redis.get(cacheKey);
        if (cachedImp) {
            return JSON.parse(cachedImp);
        }

        if (!directusUrl) return null;

        const { createDirectus, rest, staticToken, readMe } = await import("@directus/sdk");
        const testClient = createDirectus(directusUrl).with(staticToken(testToken)).with(rest());
        const rawImpUser = await testClient.request(readMe({ fields: ['id'] })) as { id: string } | null;

        if (!rawImpUser?.id) return null;

        const { rows: dbUsers } = await pool.query(
            `SELECT id, first_name, last_name, email, avatar, 
                    membership_status, membership_expiry, phone_number, 
                    date_of_birth, minecraft_username, admin_access, role
             FROM directus_users WHERE id = $1 LIMIT 1`,
            [rawImpUser.id]
        );

        if (dbUsers.length === 0) return null;

        const dbUser = dbUsers[0];
        const { rows: impCommittees } = await pool.query(
            `SELECT c.id, c.name, c.azure_group_id, m.is_leader FROM committee_members m 
             JOIN committees c ON m.committee_id = c.id WHERE m.user_id = $1`,
            [dbUser.id]
        );

        const perms = getPermissions(impCommittees);

        const targetUser: ExtendedUser = {
            id: dbUser.id,
            first_name: dbUser.first_name,
            last_name: dbUser.last_name,
            name: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
            email: dbUser.email,
            avatar: dbUser.avatar,
            membership_status: dbUser.membership_status,
            membership_expiry: dbUser.membership_expiry,
            phone_number: dbUser.phone_number,
            date_of_birth: dbUser.date_of_birth,
            minecraft_username: dbUser.minecraft_username,
            role: dbUser.role,
            committees: impCommittees,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...perms,
            isAdmin: !!dbUser.admin_access || perms.isAdmin
        };

        await redis.set(cacheKey, JSON.stringify(targetUser), 'EX', 3600);
        return targetUser;
    } catch (error) {
        console.error('❌ [RedisPlugin] Impersonation Error:', error);
        return null;
    }
}
