'use server';

import { safeConsoleError } from '@/server/utils/logger';

const MC_WHITELIST_WEBHOOK_URL = process.env.MC_WHITELIST_WEBHOOK_URL;
const MC_WHITELIST_WEBHOOK_TOKEN = process.env.MC_WHITELIST_WEBHOOK_TOKEN?.replace(/^"|"$/g, '').trim();

export async function sendWhitelistWebhook(userId: string, username: string) {
	if (!MC_WHITELIST_WEBHOOK_URL || !MC_WHITELIST_WEBHOOK_TOKEN) {
		safeConsoleError('[mcwhitelist.actions.ts][sendWhitelistWebhook] Missing webhook url or token env vars');
		return;
	}

	const webhookId = `evt-${Date.now()}`;

	try {
		const res = await fetch(MC_WHITELIST_WEBHOOK_URL, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${MC_WHITELIST_WEBHOOK_TOKEN}`,
				'Content-Type': 'application/json',
				'X-Webhook-Id': webhookId
			},
			body: JSON.stringify({ userId, username }),
			signal: AbortSignal.timeout(5000)
		});

		if (!res.ok) {
			const bodyText = await res.text().catch(() => '');
			safeConsoleError(
				`[mcwhitelist.actions.ts][sendWhitelistWebhook] Webhook failed with status ${res.status}`,
				bodyText
			);
		}
	} catch (error) {
		safeConsoleError('[mcwhitelist.actions.ts][sendWhitelistWebhook] Request failed', error);
	}
}