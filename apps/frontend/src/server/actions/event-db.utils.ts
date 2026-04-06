import { query } from '@/lib/db';

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
                description_logged_in
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
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
            data.description_logged_in || null
        ];

        const { rows } = await query(sql, params);
        return rows[0]?.id || null;
    } catch (error) {
        console.error('Error in createEventDb:', error);
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
                 'description_logged_in'].includes(key)) {
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
        console.error('Error in updateEventDb:', error);
        return false;
    }
}

export async function deleteEventDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM events WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error) {
        console.error('Error in deleteEventDb:', error);
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
        console.error('Error in createEventSignupDb:', error);
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
        console.error('Error in updateEventSignupDb:', error);
        return false;
    }
}

export async function deleteEventSignupDb(id: number): Promise<boolean> {
    try {
        const { rowCount } = await query(`DELETE FROM event_signups WHERE id = $1`, [id]);
        return (rowCount ?? 0) > 0;
    } catch (error) {
        console.error('Error in deleteEventSignupDb:', error);
        return false;
    }
}
