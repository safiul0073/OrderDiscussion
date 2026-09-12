import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest, OrdersApiResponse } from '../types';

export const getUserOrders = async (
  req: AuthenticatedRequest,
  res: Response<OrdersApiResponse | { error: string }>
): Promise<void> => {
  try {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const targetUserId = parseInt(rawId, 10);
    if (isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid user ID format' });
      return;
    }

    // Pagination setup with bounds checking to maintain responsiveness under heavy load
    const rawLimit = parseInt(req.query.limit as string, 10);
    const limit = isNaN(rawLimit) || rawLimit <= 0 ? 10 : Math.min(rawLimit, 100);
    const rawPage = parseInt(req.query.page as string, 10);
    const page = isNaN(rawPage) || rawPage <= 0 ? 1 : rawPage;
    const skip = (page - 1) * limit;

    // Fetch orders using Prisma, including user name
    const orders = await prisma.order.findMany({
      where: {
        userId: targetUserId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: skip,
      select: {
        id: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    });

    // Return 200 with data (empty array if no orders exist)
    res.status(200).json({
      data: orders,
      meta: {
        limit,
        page,
        count: orders.length,
      },
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
