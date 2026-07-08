## 2026-07-07 - [Server-side Caching & O(1) Lookups]
**Learning:** In applications using synchronous JSON file-based databases, Disk I/O becomes a significant bottleneck even at low concurrency. Nesting loops to find items in a categorized JSON structure ((N \times M)$) further degrades performance during order validation.
**Action:** Implement in-memory caching for JSON data and a flat `Map` for O(1) item lookups. Warm up the cache on server startup to eliminate cold-start latency for the first request.
