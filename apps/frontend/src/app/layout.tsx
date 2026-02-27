import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

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
        <html lang="nl" suppressHydrationWarning>
            <body className="antialiased flex flex-col min-h-screen">
                <Navigation />
                <main className="flex-grow">
                    {children}
                </main>
            </body>
        </html>
    );
}
