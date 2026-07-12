## 2026-07-07 - [Server-side Caching & O(1) Lookups]
**Learning:** In applications using synchronous JSON file-based databases, Disk I/O becomes a significant bottleneck even at low concurrency. Nesting loops to find items in a categorized JSON structure ((N \times M)$) further degrades performance during order validation.
**Action:** Implement in-memory caching for JSON data and a flat `Map` for O(1) item lookups. Warm up the cache on server startup to eliminate cold-start latency for the first request.

## 2026-07-09 - [Frontend: Efficient Filtering vs. Deep Cloning]
**Learning:** Using `JSON.parse(JSON.stringify())` for simple filtering in a single-page application (SPA) causes significant CPU spikes and memory churn on every keystroke. Modern `.map()` and `.filter()` with spread operators (`...`) are vastly more efficient for creating the necessary partial structures without the serialization overhead.
**Action:** Prefer shallow structure replication using `.map()` and object spreads over full deep cloning when preparing filtered views of data.

## 2026-07-09 - [Server-side Filtering for Large Payloads]
**Learning:** For dashboards with high polling frequencies (e.g., 3s), client-side filtering of potentially large datasets (like order history) creates unnecessary network overhead and CPU churn. Moving filtering logic to the server significantly reduces payload size and browser memory usage.
**Action:** Always consider the growth of a data set. Implement server-side filtering for endpoints that power real-time dashboards to ensure the application remains snappy even as the database grows.

## 2026-07-10 - [Frontend: Native Image Lazy Loading]
**Learning:** High-resolution images (like Unsplash category banners) are the largest contributors to page weight. Eagerly loading all category images on a single-page application (SPA) wastes bandwidth and degrades initial rendering performance, especially on mobile networks in Addis Ababa.
**Action:** Implement `loading="lazy"` on all off-screen or dynamic images to defer network requests until they are needed, significantly improving the time-to-interactive and reducing data usage.

## 2026-07-11 - [O(1) Order Management & Polling Termination]
**Learning:** In a high-polling environment (staff dashboard every 3s), repeated $O(N)$ operations on the order list create a measurable CPU bottleneck. Furthermore, continuous client polling for completed ('served') orders wastes resources on both ends.
**Action:** Introduce in-memory `Map` for $O(1)$ order lookups and a pre-calculated cache for the "active" order dashboard. Terminate customer-side polling as soon as an order reaches the terminal 'served' state.
