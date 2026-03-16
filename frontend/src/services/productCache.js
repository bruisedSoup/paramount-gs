/**
 * In-memory product cache with per-entry TTL.
 *
 * Fixes from original:
 *  - Strips undefined/null params before serialising so
 *    { category: undefined, page_size: 8 } and { page_size: 8 }
 *    produce the same key (previously they differed, causing cache misses).
 *  - Accepts an optional ttlMs per-entry so home-page fetches can be
 *    cached longer than paginated grid results.
 */

const cache = new Map()
const DEFAULT_TTL_MS = 60_000      // 60 s  — for paginated grid calls
const HOME_TTL_MS = 120_000      // 2 min — for small home-page slices

function cacheKey(params) {
    // Remove keys whose value is undefined, null, or empty string so that
    // omitted optional params never create a different key from explicit ones.
    const clean = Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
    // Stable serialisation: sort keys so insertion order doesn't matter.
    return JSON.stringify(clean, Object.keys(clean).sort())
}

export function getCached(params) {
    const key = cacheKey(params)
    const entry = cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.ts > entry.ttl) {
        cache.delete(key)
        return null
    }
    return entry.data
}

/**
 * @param {object} params   – same params object passed to getProducts()
 * @param {*}      data     – the API response data to cache
 * @param {number} [ttlMs]  – override TTL in milliseconds
 */
export function setCached(params, data, ttlMs) {
    const ttl = ttlMs ?? (params?.page_size <= 8 ? HOME_TTL_MS : DEFAULT_TTL_MS)
    cache.set(cacheKey(params), { data, ts: Date.now(), ttl })
}

export function invalidateCache() {
    cache.clear()
}