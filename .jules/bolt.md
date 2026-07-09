## 2026-07-07 - [Server-side Caching & O(1) Lookups]
**Learning:** In applications using synchronous JSON file-based databases, Disk I/O becomes a significant bottleneck even at low concurrency. Nesting loops to find items in a categorized JSON structure ((N \times M)$) further degrades performance during order validation.
**Action:** Implement in-memory caching for JSON data and a flat `Map` for O(1) item lookups. Warm up the cache on server startup to eliminate cold-start latency for the first request.

## 2026-07-09 - [Frontend: Efficient Filtering vs. Deep Cloning]
**Learning:** Using `JSON.parse(JSON.stringify())` for simple filtering in a single-page application (SPA) causes significant CPU spikes and memory churn on every keystroke. Modern `.map()` and `.filter()` with spread operators (`...`) are vastly more efficient for creating the necessary partial structures without the serialization overhead.
**Action:** Prefer shallow structure replication using `.map()` and object spreads over full deep cloning when preparing filtered views of data.
