export default function AuditLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
                            AI
                        </div>
                        <span className="font-semibold text-white text-lg tracking-tight">
                            SpendAudit
                        </span>
                    </a>
                    <a href="/" className="btn-secondary text-sm px-4 py-2">
                        ← New Audit
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="pt-16">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
                    {children}
                </div>
            </main>
        </div>
    );
}
