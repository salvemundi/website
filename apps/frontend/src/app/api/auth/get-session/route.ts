import { getEnrichedSession } from "@/server/auth/auth-utils";

export async function GET(_request: Request) {
    try {
        const session = await getEnrichedSession();

        return Response.json(session);
    } catch (error) {
        console.error('❌ [GetSession API] CRITICAL ERROR:', error instanceof Error ? error.stack : error);
        return new Response(JSON.stringify({ error: 'Internal Server Error', details: error instanceof Error ? error.message : String(error) }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
