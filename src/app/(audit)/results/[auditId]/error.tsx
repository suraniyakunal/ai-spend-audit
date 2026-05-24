'use client';

export default function ResultsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="text-center py-20">
            <div className="text-4xl mb-4">😵</div>
            <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
                We couldn&apos;t load your audit results. This might be a temporary issue.
            </p>
            <div className="flex gap-3 justify-center">
                <button onClick={reset} className="btn-primary">
                    Try Again
                </button>
                <a href="/" className="btn-secondary">
                    New Audit
                </a>
            </div>
        </div>
    );
}
