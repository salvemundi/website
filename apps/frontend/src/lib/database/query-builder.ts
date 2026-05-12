/**
 * Utility to build a dynamic PostgreSQL UPDATE query.
 */
export function buildUpdateQuery(
    table: string,
    id: number | string,
    data: Record<string, unknown>, // Gewijzigd: unknown is veiliger dan any
    allowedFields?: string[]
) {
    const fields: string[] = [];
    const params: unknown[] = []; // Gewijzigd: unknown[] voldoet aan de Zero Warning Policy
    let paramIndex = 1;

    for (const [key, value] of Object.entries(data)) {
        if (!allowedFields || allowedFields.includes(key)) {
            fields.push(`${key} = $${paramIndex}`);
            params.push(value);
            paramIndex++;
        }
    }

    if (fields.length === 0) {
        return null;
    }

    params.push(id);
    const sql = `UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

    return { sql, params };
}