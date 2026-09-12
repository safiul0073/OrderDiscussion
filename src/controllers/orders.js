const pool = require('../db/pool');

const getUserOrders = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // Pagination setup (Limit/Offset) to handle scale
        const limit = parseInt(req.query.limit, 10) || 10;
        const page = parseInt(req.query.page, 10) || 1;
        const offset = (page - 1) * limit;

        // Fetch orders. The idx_orders_user_id_created_at index makes this highly performant.
        const query = `
            SELECT id, total_amount, status, created_at 
            FROM orders 
            WHERE user_id = $1 
            ORDER BY created_at DESC 
            LIMIT $2 OFFSET $3
        `;

        const { rows } = await pool.query(query, [targetUserId, limit, offset]);

        // Requirement: "Handle users who have no orders" -> return []
        res.status(200).json({
            data: rows,
            meta: {
                limit,
                page,
                count: rows.length
            }
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getUserOrders };
