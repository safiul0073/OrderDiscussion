# Orders API Service

A high-performance, strictly-typed Node.js & TypeScript API for retrieving user order histories.

## Setup Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL (either via Docker OR a local installation)

### 1. Environment Variables (.env setup)

Before running the application, you must configure your environment variables. 
We provide an example environment file for you to use. Run the following command in your terminal:

```bash
cp .example.env .env
```

Open the newly created `.env` file and ensure the `DATABASE_URL` is set correctly for your environment (see Database Setup below).

### 2. Database Setup

You can run PostgreSQL either via Docker or using a local installation.

#### Option A: With Docker (Recommended)
If you have Docker installed, simply run the following command to start a containerized Postgres instance. 
The default `DATABASE_URL` in `.example.env` is already configured for this setup.

```bash
docker-compose up -d
```

#### Option B: Without Docker (Local PostgreSQL)
If you do not have Docker installed, you can run PostgreSQL locally:
1. Install PostgreSQL on your machine (e.g., via Homebrew on Mac: `brew install postgresql`).
2. Start the PostgreSQL service.
3. Create a new database for this project in your terminal (e.g., `createdb orders_db`).
4. Update your `.env` file with your local PostgreSQL credentials. It should look like this:
   ```env
   DATABASE_URL="postgresql://<YOUR_USER>:<YOUR_PASSWORD>@localhost:5432/<YOUR_DB_NAME>?schema=public"
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize and Seed the Database

Run the following commands to push the schema to the database and generate mock data (~5,000 users, ~50,000 orders):

```bash
npx prisma db push
npm run seed
```

### 5. Run the Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 6. Run the Tests

```bash
npm test
```

## How to Test the API Manually

The API relies on `x-user-id` and `x-user-role` headers to simulate authentication.

**1. Valid Request (User views their own orders):**

```bash
curl -X GET http://localhost:3000/api/users/1/orders \
  -H "x-user-id: 1" \
  -H "x-user-role: user"
```

**2. Forbidden Request (User tries to view someone else's):**

```bash
curl -X GET http://localhost:3000/api/users/2/orders \
  -H "x-user-id: 1" \
  -H "x-user-role: user"
```

**3. Admin Request (Admin views someone else's):**

```bash
curl -X GET http://localhost:3000/api/users/2/orders \
  -H "x-user-id: 99" \
  -H "x-user-role: admin"
```

**4. Rate Limiting test:**
If you run the CURL command more than 100 times in 15 minutes, you will receive a `429 Too Many Requests` response.
