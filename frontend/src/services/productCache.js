// frontend/src/services/productCache.js
// Simple in-memory cache with a TTL (default 60 s).
// Drop this file in src/services/ and import it in Products.jsx.

const cache = new Map()
const TTL_MS = 60_000 // 60 seconds

function cacheKey(params) {
    return JSON.stringify(params ?? {})
}

export function getCached(params) {
    const key = cacheKey(params)
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > TTL_MS) {
        cache.delete(key)
        return null
    }
    return entry.data
}

export function setCached(params, data) {
    cache.set(cacheKey(params), { data, ts: Date.now() })
}

export function invalidateCache() {
    cache.clear()
}