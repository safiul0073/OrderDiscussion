# DECISIONS.md

### 1. What did the requirements not tell you?
The project requirements were intentionally sparse. I had to make several assumptions to build a complete API:
*   **[LEAST CONFIDENT / HIGHEST RISK] Authentication mechanism:** I assumed authentication is handled upstream (e.g., by an API Gateway) that forwards user context to this service via HTTP headers (`x-user-id` and `x-user-role`). If this service is exposed directly to the internet without that gateway, anyone can spoof any user.
*   **Response format:** I assumed that if a user has no orders, the API should return a `200 OK` with an empty array `[]` rather than a `404 Not Found`. 
*   **Pagination strategy:** I assumed limit/offset pagination is sufficient for the current scale (~50,000 orders total).
*   **Local Setup & DX (Docker):** I assumed other developers would appreciate a frictionless setup, so I included a `docker-compose.yml` that automatically initializes the database.

### 2. What did you use AI for, and where did you override it?
I used an AI assistant to migrate the project to TypeScript, write the database seeder, and scaffold tests. However, I had to override it in several key areas where it got things wrong:
1.  **Unbounded Pagination (Security/Performance):** The AI initially generated a pagination implementation that allowed any `limit`. This violated the "must stay responsive" requirement, as a user could request all 50,000 records at once. I overrode this by adding strict bounds-checking in the controller, capping the limit to 100 max.
2.  **Seeder Performance:** The AI initially wrote a naive `prisma/seed.ts` script that created records one by one in a loop, which took too long. I manually overrode the strategy to use batched inserts and raw SQL `TRUNCATE TABLE ... RESTART IDENTITY CASCADE` to ensure fast, deterministic ID generation.
3.  **Pathing Bugs During TS Migration:** When moving to TypeScript, the AI relocated the Prisma client but failed to update the relative imports in `src/controllers/orders.ts`, causing a `MODULE_NOT_FOUND` crash. I tracked down the stack trace and corrected the paths.
4.  **Sorting Optimization:** The AI just added `orderBy: { createdAt: 'desc' }`. I recognized this would cause a full-table scan, so I manually added a composite B-Tree index `@@index([userId, createdAt(sort: Desc)])` to the Prisma schema to guarantee sub-millisecond query times.

### 3. What breaks first at 100x this data?
At 100x the data (5,000,000 orders), two primary systems will break:
1.  **Database Pagination (Offset):** Using `skip` (offset) in Prisma becomes progressively slower as the dataset grows because PostgreSQL must scan and discard `Y` rows before returning `X`. 
    *   **Detection:** We would detect this by monitoring the `p95` and `p99` response latencies of this endpoint in a tool like Datadog or Prometheus.
    *   **Fix:** Migrate from Offset pagination to **Cursor-based pagination** (which Prisma supports natively via the `cursor` property).
2.  **Rate Limiter:** I implemented an in-memory rate limiter to prevent abuse. At 100x scale, this Node.js service would likely be deployed across multiple instances/pods behind a load balancer. The in-memory rate limiter would become completely ineffective because state is not shared between pods.
    *   **Fix:** Migrate the rate limiter store to a centralized **Redis** cache.

### 4. What did you deliberately not build?
Every engineering decision is a trade-off. To respect the project scope and time constraints, I deliberately omitted:
*   **Full JWT validation:** Implemented simple header-based mock auth instead of importing a JWKS client or RSA key verification to keep the service easy to run locally.
*   **Cursor pagination:** Opted for limit/offset which is perfectly adequate for 50k records and faster to implement flawlessly.
*   **Redis integration:** Opted for in-memory rate limiting to minimize external dependencies. This ensures other developers only have to spin up the single Postgres container provided in the Docker Compose file, rather than a complex suite of services.
