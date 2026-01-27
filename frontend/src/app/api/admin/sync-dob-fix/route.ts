import { NextResponse } from 'next/server';

export async function POST() {
    try {
        // We assume graph-sync is reachable internally via http://graph-sync:3001
        // If this is running in a different environment, this URL might need to come from an ENV var.
        const GRAPH_SYNC_URL = process.env.GRAPH_SYNC_URL || 'http://graph-sync:3001';

        const res = await fetch(`${GRAPH_SYNC_URL}/sync/dob-fix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const text = await res.text();
            return NextResponse.json({ error: `Graph sync service error: ${res.status}`, details: text }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Proxy error:', error);
        return NextResponse.json({ error: 'Failed to trigger sync', details: error.message }, { status: 500 });
    }
}
