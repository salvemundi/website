import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.INTERNAL_DB_HOST}:5432/${process.env.DB_NAME}`
});

export const auth = betterAuth({
    database: pool,
    socialProviders: {
        microsoft: {
            clientId: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_ID!,
            clientSecret: process.env.AZURE_WEBSITEV7_AUTH_CLIENT_SECRET!,
            tenantId: process.env.AZURE_WEBSITEV7_TENANT_ID!,
        },
    },
    user: {
        modelName: "directus_users",
        additionalFields: {
            first_name: { type: "string" },
            last_name: { type: "string" },
            membership_status: { type: "string" },
            membership_expiry: { type: "string" },
            phone_number: { type: "string" },
            date_of_birth: { type: "string" },
            avatar: { type: "string" },
            minecraft_username: { type: "string" },
        }
    },
    session: {
        modelName: "auth_sessions"
    },
    account: {
        modelName: "auth_accounts"
    },
    plugins: [
        {
            id: "committee-enrichment",
            hooks: {
                after: [
                    {
                        matcher: (ctx) => ctx.path.includes("get-session"),
                        handler: async (ctx: any) => {
                            const session = ctx.context?.returned || ctx.response || ctx.json || ctx.body;
                            
                            if (session && session.user) {
                                try {
                                    const { rows } = await pool.query(
                                        `SELECT c.id, c.name, m.is_leader 
                                         FROM committee_members m 
                                         JOIN committees c ON m.committee_id = c.id 
                                         WHERE m.user_id = $1`,
                                        [session.user.id]
                                    );
                                    
                                    session.user.committees = rows;
                                } catch (error) {
                                    console.error("[AUTH-PLUGIN] Error enrichment:", error);
                                }
                            }
                            return ctx.context?.returned || ctx.response || ctx.json || ctx.body || ctx;
                        }
                    }
                ]
            }
        }
    ]
});
