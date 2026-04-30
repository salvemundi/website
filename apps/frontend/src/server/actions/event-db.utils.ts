import { query } from '@/lib/database';

/**
 * Event Operations
 */

export async function createEventDb(data: any): Promise<number | null> {
    try {
        const sql = `
            INSERT INTO events (
                name, description, location, max_sign_ups, price_members, price_non_members,
                only_members, registration_deadline, contact, image, committee_id,
                event_date, event_time, event_date_end, event_time_end, status, publish_date,
                description_logged_in, custom_url
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
            ) RETURNING id
        `;
        
        const params = [
            data.name || null,
            data.description || null,
            data.location || null,
            data.max_sign_ups !== undefined ? data.max_sign_ups : null,
            data.price_members !== undefined ? data.price_members : null,
            data.price_non_members !== undefined ? data.price_non_members : null,
            data.only_members ? true : false,
            data.registration_deadline || null,
            data.contact || null,
            data.image || null,
            data.committee_id || null,
            data.event_date || null,
            data.event_time || null,
            data.event_date_end || null,
            data.event_time_end || null,
            data.status || 'draft',
            data.publish_date || null,
            data.description_logged_in || null,
            data.custom_url || null
        ];

        const { rows } = await query(sql, params);
        return rows[0]?.id || null;
    } catch (error) {
        
        return null;
    }
}

export async function updateEventDb(id: number, data: any): Promise<boolean> {
    try {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(data)) {
            // Include valid columns
            if (['name', 'description', 'location', 'max_sign_ups', 'price_members', 'price_non_members',
                 'only_members', 'registration_deadline', 'contact', 'image', 'committee_id',
                 'event_date', 'event_time', 'event_date_end', 'event_time_end', 'status', 'publish_date',
                 'description_logged_in', 'custom_url'].includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) return true; // Nothing to update
        
        params.push(id);
        const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id`;
        
        const { rows } = await query(sql, params);
        return rows.length > 0;
    } catch (error) {
        
        return false;
    }
}

export async function deleteEventDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM events WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error) {
        
        return false;
    }
}

/**
 * Event Signup Operations
 */

export async function createEventSignupDb(data: any): Promise<number | null> {
    try {
        const sql = `
            INSERT INTO event_signups (
                event_id, participant_name, participant_email, participant_phone,
                payment_status, qr_token, directus_relations, checked_in, checked_in_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9
            ) RETURNING id
        `;
        
        const params = [
            data.event_id,
            data.participant_name || null,
            data.participant_email || null,
            data.participant_phone || null,
            data.payment_status || 'open',
            data.qr_token || null,
            data.directus_relations || null,
            data.checked_in ? true : false,
            data.checked_in_at || null
        ];

        const { rows } = await query(sql, params);
        return rows[0]?.id || null;
    } catch (error) {
        
        return null;
    }
}

export async function updateEventSignupDb(id: number, data: any): Promise<boolean> {
    try {
        const fields = [];
        const params = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(data)) {
            if (['payment_status', 'checked_in', 'checked_in_at', 'participant_name', 'participant_email', 'participant_phone'].includes(key)) {
                fields.push(`${key} = $${paramIndex}`);
                params.push(value);
                paramIndex++;
            }
        }

        if (fields.length === 0) return true;
        
        params.push(id);
        const sql = `UPDATE event_signups SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id`;
        
        const { rows } = await query(sql, params);
        return rows.length > 0;
    } catch (error) {
        
        return false;
    }
}

export async function deleteEventSignupDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM event_signups WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error) {
        
        return false;
    }
}

/**
 * Fetches multiple event signups for a user (consistent with fetchUserEventSignupsDb)
 */
export async function fetchUserEventSignupsDb(email: string): Promise<any[]> {
    try {
        const sql = `
            SELECT es.*, e.name as event_name, e.event_date, e.description, e.image, e.contact, e.custom_url
            FROM event_signups es
            JOIN events e ON es.event_id = e.id
            WHERE LOWER(es.participant_email) = LOWER($1)
            ORDER BY e.event_date DESC
        `;
        const { rows } = await query(sql, [email]);
        return rows.map(row => ({
            ...row,
            event_id: {
                id: row.event_id,
                name: row.event_name,
                event_date: row.event_date,
                description: row.description,
                image: row.image,
                contact: row.contact,
                custom_url: row.custom_url
            }
        }));
    } catch (error) {
        
        return [];
    }
}

/**
 * Fetches a single event signup by ID with event details.
 */
export async function fetchEventSignupByIdDb(id: number): Promise<any | null> {
    try {
        const sql = `
            SELECT es.*, e.name as event_name, e.event_date, e.description, e.image, e.contact, e.custom_url
            FROM event_signups es
            JOIN events e ON es.event_id = e.id
            WHERE es.id = $1
            LIMIT 1
        `;
        const { rows } = await query(sql, [id]);
        if (rows.length === 0) return null;

        const row = rows[0];
        return {
            ...row,
            event_id: {
                id: row.event_id,
                name: row.event_name,
                event_date: row.event_date,
                description: row.description,
                image: row.image,
                contact: row.contact,
                custom_url: row.custom_url
            }
        };
    } catch (error) {
        
        return null;
    }
}
