import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const h = await headers();
        console.log(`[DEBUG - route.ts] Headers check for getSession: ${h ? 'Present' : 'MISSING'}`);
        console.log(`[DEBUG - route.ts] Cookie header: ${h.get('cookie') ? 'Found' : 'Missing'}`);
        
        const session = await auth.api.getSession({
            headers: h
        });
        return NextResponse.json(session);
    } catch (error) {
        console.error("[api/auth/get-session] Error:", error);
        return new NextResponse(null, { status: 500 });
    }
}
