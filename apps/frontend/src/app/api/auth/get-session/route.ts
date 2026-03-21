import { auth } from "@/server/auth/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        console.log(`[DEBUG - route.ts] Handling get-session request with full context`);
        return await auth.handler(request);
    } catch (error) {
        console.error("[api/auth/get-session] Error:", error);
        return new Response(null, { status: 500 });
    }
}
