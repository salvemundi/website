import { auth } from "@/server/auth/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        return NextResponse.json(session);
    } catch (error) {
        console.error("[api/auth/get-session] Error:", error);
        return new NextResponse(null, { status: 500 });
    }
}
