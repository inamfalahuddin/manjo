'use client';

import { HeroUIProvider } from '@heroui/react';

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <HeroUIProvider>
            <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                {children}
            </main>
        </HeroUIProvider>
    );
}