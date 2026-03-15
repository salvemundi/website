'use server';

import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Pool } from "pg";

const pool = new Pool({
    connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.INTERNAL_DB_HOST}:5432/${process.env.DB_NAME}`
});

/**
 * Checks if the current user is an ICT or Board member.
 */
async function checkAdminAccess() {
    const session = await auth.api.getSession({
        headers: await headers()
    });

    if (!session || !session.user) {
        return { isAuthorized: false, user: null };
    }

    const committees = (session.user as any).committees || [];
    const isAdmin = committees.some((c: any) => 
        c.name.toLowerCase().includes('ict') || 
        c.name.toLowerCase().includes('bestuur')
    );

    return { isAuthorized: isAdmin, user: session.user };
}

/**
 * Fetches general dashboard statistics.
 */
export async function getDashboardStats() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Unauthorized");

    try {
        const [memberCount, signupCount, eventCount] = await Promise.all([
            pool.query("SELECT COUNT(*) FROM directus_users WHERE status = 'active'"),
            pool.query("SELECT COUNT(*) FROM event_signups"),
            pool.query("SELECT COUNT(*) FROM events WHERE event_date >= CURRENT_DATE")
        ]);

        return {
            totalMembers: parseInt(memberCount.rows[0].count),
            totalSignups: parseInt(signupCount.rows[0].count),
            upcomingEvents: parseInt(eventCount.rows[0].count)
        };
    } catch (error) {
        console.error("[ADMIN-ACTION] getDashboardStats failed:", error);
        return { totalMembers: 0, totalSignups: 0, upcomingEvents: 0 };
    }
}

/**
 * Fetches upcoming birthdays in the next 7 days.
 */
export async function getUpcomingBirthdays() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Unauthorized");

    try {
        const { rows } = await pool.query(`
            SELECT first_name, last_name, date_of_birth
            FROM directus_users
            WHERE date_of_birth IS NOT NULL
              AND (
                date_part('month', date_of_birth) = date_part('month', CURRENT_DATE)
                AND date_part('day', date_of_birth) >= date_part('day', CURRENT_DATE)
                AND date_part('day', date_of_birth) <= date_part('day', CURRENT_DATE) + 7
              )
            LIMIT 10
        `);

        return rows.map(r => ({
            name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
            date: r.date_of_birth
        }));
    } catch (error) {
        console.error("[ADMIN-ACTION] getUpcomingBirthdays failed:", error);
        return [];
    }
}

/**
 * Fetches recent system logs (mail service etc).
 */
export async function getSystemLogs() {
    const { isAuthorized } = await checkAdminAccess();
    if (!isAuthorized) throw new Error("Unauthorized");

    try {
        // Example: Fetching from a hypothetical system_logs table
        const { rows } = await pool.query(`
            SELECT id, action, collection, timestamp 
            FROM directus_activity 
            ORDER BY timestamp DESC 
            LIMIT 10
        `);
        return rows;
    } catch (error) {
        console.error("[ADMIN-ACTION] getSystemLogs failed:", error);
        return [];
    }
}
