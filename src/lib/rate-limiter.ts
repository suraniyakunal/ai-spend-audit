/**
 * Simple in-memory sliding window rate limiter.
 * Tracks requests per IP with automatic cleanup of stale entries.
 */

type RateLimitEntry = {
    timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 10 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
    const now = Date.now();
    if (now - lastCleanup < CLEANUP_INTERVAL) return;

    lastCleanup = now;
    const cutoff = now - windowMs;

    store.forEach((entry, key) => {
        entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);
        if (entry.timestamps.length === 0) {
            store.delete(key);
        }
    });
}

/**
 * Check if a request from the given IP is allowed.
 * @param ip - IP address to check
 * @param limit - Max requests allowed in the window (default: 10)
 * @param windowMs - Window size in milliseconds (default: 1 hour)
 * @returns { allowed, remaining } — whether the request is allowed and how many remain
 */
export function checkRateLimit(
    ip: string,
    limit: number = 10,
    windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const cutoff = now - windowMs;

    cleanupStaleEntries(windowMs);

    let entry = store.get(ip);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(ip, entry);
    }

    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

    if (entry.timestamps.length >= limit) {
        return { allowed: false, remaining: 0 };
    }

    entry.timestamps.push(now);
    return { allowed: true, remaining: limit - entry.timestamps.length };
}

/**
 * Reset the store — useful for testing.
 */
export function resetRateLimiter() {
    store.clear();
}
