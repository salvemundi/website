import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Salve Mundi",
        template: "%s | Salve Mundi",
    },
    description:
        "Salve Mundi — De studievereniging voor ICT-studenten aan Fontys Hogeschool Eindhoven.",
    metadataBase: new URL(
        process.env.BASE_URL ?? "http://localhost:3000"
    ),
    openGraph: {
        type: "website",
        locale: "nl_NL",
        siteName: "Salve Mundi",
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="nl">
            <body>{children}</body>
        </html>
    );
}
