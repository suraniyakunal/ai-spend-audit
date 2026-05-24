export default function MarketingLayout({
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
                    <a
                        href="#audit-form"
                        className="btn-primary text-sm px-4 py-2"
                    >
                        Run Free Audit
                    </a>
                </div>
            </header>

            {/* Content */}
            <main className="pt-16">{children}</main>

            {/* Footer */}
            <footer className="border-t border-white/5 py-8 mt-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
                    <p>© {new Date().getFullYear()} AI Spend Audit. Free tool by Credex.</p>
                </div>
            </footer>
        </div>
    );
}
