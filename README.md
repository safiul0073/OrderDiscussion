# Orders API Service

## Setup Instructions

### Prerequisites
* Node.js (v18+)
* Docker & Docker Compose

### 1. Start the Database
Run the following command to start PostgreSQL in the background.

```bash
docker-compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Push Database Schema
We use Prisma ORM. Push the schema to the database:
```bash
npx prisma db push
```

### 4. Seed the Database
A dynamic seed script is provided using Faker.js. By default, it generates 100 users and 1,000 orders.
To generate massive amounts of data dynamically, prefix the command with environment variables:

```bash
# Default seed (100 users, 1000 orders)
npx prisma db seed

# Massive dynamic seed (1,000 users, 50,000 orders)
SEED_USER_COUNT=1000 SEED_ORDERS_PER_USER=50 npx prisma db seed
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
