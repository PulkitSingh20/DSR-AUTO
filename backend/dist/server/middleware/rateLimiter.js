const store = new Map();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 120; // per window
export function rateLimiter(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = req.headers["x-api-key"] || ip;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
        store.set(key, { count: 1, resetAt: now + WINDOW_MS });
        res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
        res.setHeader("X-RateLimit-Remaining", MAX_REQUESTS - 1);
        res.setHeader("X-RateLimit-Reset", Math.ceil((now + WINDOW_MS) / 1000));
        return next();
    }
    entry.count++;
    const remaining = Math.max(0, MAX_REQUESTS - entry.count);
    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000));
    if (entry.count > MAX_REQUESTS) {
        return res.status(429).json({
            error: "TOO_MANY_REQUESTS",
            message: `Rate limit exceeded. ${MAX_REQUESTS} requests per minute allowed.`,
            retryAfter: Math.ceil((entry.resetAt - now) / 1000),
        });
    }
    next();
}
