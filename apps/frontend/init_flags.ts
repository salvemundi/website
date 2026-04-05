import { query } from './src/lib/db';

async function main() {
    try {
        await query("INSERT INTO feature_flags (is_active, message, route_match) VALUES (false, 'Lidmaatschap verloop controle (automatische mails)', 'mail_expiry_check') ON CONFLICT DO NOTHING");
        await query("INSERT INTO feature_flags (is_active, message, route_match) VALUES (false, 'Evenement herinneringen (automatische mails)', 'mail_event_reminders') ON CONFLICT DO NOTHING");
        console.log('Feature flags inserted successfully.');
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
