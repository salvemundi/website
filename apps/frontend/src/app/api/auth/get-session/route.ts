import { auth } from "@/server/auth/auth";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        return await auth.handler(request);
    } catch (error) {
        
        return new Response(null, { status: 500 });
    }
}
