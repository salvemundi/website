/**
 * Utility to build a dynamic PostgreSQL UPDATE query.
 * 
 * @param table The table name
 * @param id The ID of the record to update
 * @param data Object containing fields to update
 * @param allowedFields List of fields allowed to be updated (for security)
 * @returns { sql: string, params: any[] }
 */
export function buildUpdateQuery(
    table: string,
    id: number | string,
    data: Record<string, any>,
    allowedFields?: string[]
) {
    const fields: string[] = [];
    const params: any[] = [];
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
