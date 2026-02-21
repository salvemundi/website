"use client";

import { useEffect, useState } from "react";

export default function AccountHeader({
    firstName,
    lastName,
    email
}: {
    firstName?: string,
    lastName?: string,
    email?: string
}) {
    const [showEasterEgg, setShowEasterEgg] = useState(false);

    useEffect(() => {
        // Temporarily 50% for testing
        setShowEasterEgg(Math.random() < 0.0001);
    }, []);

    const displayName = showEasterEgg ? "Vouw een bak!" : firstName;

    return (
        <div className="min-w-0 w-full">
            <h2 className="text-xl sm:text-2xl font-extrabold text-theme-purple dark:text-white break-words">
                {showEasterEgg
                    ? displayName
                    : (firstName && lastName
                        ? `${firstName} ${lastName}`
                        : email || "User")}
            </h2>
        </div>
    );
}
