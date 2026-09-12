# DECISIONS.md

### 1. What did the requirements not tell you?
The project requirements were intentionally sparse. I had to make several assumptions to build a complete API:
*   **Authentication mechanism:** I assumed authentication is handled upstream (e.g., by an API Gateway) that forwards user context to this service via HTTP headers (`x-user-id` and `x-user-role`).
*   **Response format:** I assumed that if a user has no orders, the API should return a `200 OK` with an empty array `[]` rather than a `404 Not Found`. 
*   **Pagination strategy:** I assumed limit/offset pagination is sufficient for the current scale (~50,000 orders total).
*   **Local Setup & DX (Docker):** I assumed other developers would appreciate a frictionless setup, so I included a `docker-compose.yml` that automatically initializes the database.

### 2. What did you use AI for, and where did you override it?
I used AI to quickly scaffold the Express boilerplate, the Jest test configuration, and the Docker Compose setup. 

However, I explicitly directed the AI to write the authorization middleware rather than just returning a simple controller. Furthermore, I directed the use of **Prisma ORM** instead of raw SQL to ensure type safety, provide a robust dynamic seeder, and handle database indexing seamlessly. I explicitly defined a **composite database index on `[userId, createdAt]`** within the Prisma schema for efficient sorting. I also directed the inclusion of an `express-rate-limit` middleware.

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
