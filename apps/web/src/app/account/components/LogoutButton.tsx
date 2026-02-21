"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/features/auth/providers/auth-provider";

export default function LogoutButton() {
    const { logout } = useAuth();

    const handleLogout = async () => {
        try {
            localStorage.removeItem("auth_return_to");
        } catch {
            // ignore storage errors
        }
        await logout();
        if (typeof window !== "undefined") {
            window.location.href = "/?noAuto=true";
        }
    };

    return (
        <button
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold text-white bg-theme-purple hover:bg-theme-purple-light transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
            <LogOut className="h-4 w-4" />
            Uitloggen
        </button>
    );
}
