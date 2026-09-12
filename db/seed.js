const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'orders_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function seed() {
    try {
        console.log('Beginning database seed...');
        
        // Insert a few users
        await pool.query(`
            INSERT INTO users (id, email) VALUES 
            (1, 'alice@example.com'),
            (2, 'bob@example.com'),
            (3, 'charlie_no_orders@example.com')
            ON CONFLICT (id) DO NOTHING;
        `);

        // Insert orders for Alice and Bob
        await pool.query(`
            INSERT INTO orders (user_id, total_amount, status, created_at) VALUES 
            (1, 150.00, 'completed', NOW() - INTERVAL '1 day'),
            (1, 20.50, 'completed', NOW() - INTERVAL '2 days'),
            (1, 99.99, 'pending', NOW()),
            (2, 5.00, 'completed', NOW() - INTERVAL '5 days');
        `);

        console.log('Database seeded successfully!');
    } catch (err) {
        console.error('Error seeding DB:', err);
    } finally {
        await pool.end();
    }
}

seed();
