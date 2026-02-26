import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Salve Mundi V7",
    description: "SV Salve Mundi Digitaal Platform",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="nl">
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
