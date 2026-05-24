import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'AI Spend Audit — Find Where You\'re Overspending on AI Tools',
    description:
        'Free AI spend audit in 60 seconds. Discover cost-saving opportunities across Cursor, GitHub Copilot, ChatGPT, Claude, and more. No account needed.',
    keywords: ['AI spend', 'AI audit', 'cost optimization', 'Cursor', 'Copilot', 'ChatGPT', 'Claude'],
    openGraph: {
        title: 'AI Spend Audit — Find Where You\'re Overspending on AI Tools',
        description: 'Free AI spend audit in 60 seconds. No account needed.',
        type: 'website',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-gray-950 font-sans antialiased">
                {children}
            </body>
        </html>
    );
}
