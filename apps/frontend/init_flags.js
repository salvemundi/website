const { Pool } = require('pg');

const pool = new Pool({
    user: 'directusadmin',
    host: '100.77.182.130',
    database: 'v7-core-db',
    password: 'xrb5VBT_qpd2njm7gqv',
    port: 5432,
});

async function main() {
    try {
        const { rows: existing } = await pool.query("SELECT route_match FROM feature_flags WHERE route_match IN ('mail_expiry_check', 'mail_event_reminders')");
        const existingMatches = existing.map(r => r.route_match);

        if (!existingMatches.includes('mail_expiry_check')) {
            await pool.query("INSERT INTO feature_flags (name, route_match, is_active, message) VALUES ('Mail Expiry Check', 'mail_expiry_check', false, 'Lidmaatschap verloop controle (automatische mails)')");
            console.log('Inserted mail_expiry_check');
        }
        
        if (!existingMatches.includes('mail_event_reminders')) {
            await pool.query("INSERT INTO feature_flags (name, route_match, is_active, message) VALUES ('Mail Event Reminders', 'mail_event_reminders', false, 'Evenement herinneringen (automatische mails)')");
            console.log('Inserted mail_event_reminders');
        }

        console.log('Feature flags check completed.');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
