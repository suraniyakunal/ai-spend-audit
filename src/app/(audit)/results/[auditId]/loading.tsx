export default function ResultsLoading() {
    return (
        <div className="space-y-10 animate-pulse">
            {/* Hero skeleton */}
            <div className="text-center">
                <div className="skeleton h-6 w-48 mx-auto mb-4" />
                <div className="skeleton h-12 w-80 mx-auto mb-3" />
                <div className="skeleton h-6 w-60 mx-auto" />
            </div>

            {/* Table skeleton */}
            <div>
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="glass-card p-4 space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                            <div className="skeleton h-4 w-1/5" />
                            <div className="skeleton h-4 w-1/5" />
                            <div className="skeleton h-4 w-1/5" />
                            <div className="skeleton h-4 w-1/5" />
                            <div className="skeleton h-4 w-1/5" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Summary skeleton */}
            <div>
                <div className="skeleton h-6 w-48 mb-4" />
                <div className="glass-card p-6 space-y-3">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-4 w-full" />
                    <div className="skeleton h-4 w-5/6" />
                </div>
            </div>
        </div>
    );
}
