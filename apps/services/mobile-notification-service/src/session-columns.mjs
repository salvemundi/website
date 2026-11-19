// Better Auth installations may use either supported physical column layout.
// Identifiers are selected only from this closed allowlist, never request data.
const approvedColumns = Object.freeze({
    expiresAt: ['expiresAt', 'expires_at'],
    userId: ['userId', 'user_id']
});
const resolvedClients = new WeakMap();

export async function getWorkerSessionColumns(client) {
    const cached = resolvedClients.get(client);
    if (cached) return cached;
    const { rows } = await client.query(
        'SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name=$1',
        ['auth_sessions']
    );
    const present = new Set(rows.map(row => row.column_name));
    const resolved = {};
    for (const [field, candidates] of Object.entries(approvedColumns)) {
        const matching = candidates.filter(candidate => present.has(candidate));
        if (matching.length !== 1) {
            const error = new Error('Unsupported mobile authentication session schema');
            error.code = 'MOBILE_SESSION_SCHEMA_UNSUPPORTED';
            throw error;
        }
        resolved[field] = `"${matching[0]}"`;
    }
    const columns = Object.freeze(resolved);
    // Only successful resolutions are cached; transient/configuration failures retry.
    resolvedClients.set(client, columns);
    return columns;
}
