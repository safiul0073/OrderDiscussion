const prisma = require('../db/prisma');

const getUserOrders = async (req, res) => {
    try {
        const targetUserId = parseInt(req.params.id, 10);
        if (isNaN(targetUserId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        // Pagination setup
        const limit = parseInt(req.query.limit, 10) || 10;
        const page = parseInt(req.query.page, 10) || 1;
        const skip = (page - 1) * limit;

        // Fetch orders using Prisma
        const orders = await prisma.order.findMany({
            where: {
                userId: targetUserId
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit,
            skip: skip,
            select: {
                id: true,
                totalAmount: true,
                status: true,
                createdAt: true
            }
        });

        // Return 200 with data (empty array if no orders exist)
        res.status(200).json({
            data: orders,
            meta: {
                limit,
                page,
                count: orders.length
            }
        });

    } catch (error) {
        console.error('Error fetching user orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getUserOrders };
