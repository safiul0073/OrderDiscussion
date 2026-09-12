import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

// Mock Prisma
jest.mock('../src/config/prisma', () => ({
  __esModule: true,
  default: {
    order: {
      findMany: jest.fn(),
    },
  },
}));

describe('GET /api/users/:id/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if missing x-user-id header', async () => {
    const response = await request(app).get('/api/users/1/orders');
    expect(response.status).toBe(401);
  });

  it("should return 403 if a user tries to view another user's orders", async () => {
    const response = await request(app)
      .get('/api/users/2/orders')
      .set('x-user-id', '1')
      .set('x-user-role', 'user');

    expect(response.status).toBe(403);
  });

  it("should allow an admin to view any user's orders", async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/users/2/orders')
      .set('x-user-id', '99')
      .set('x-user-role', 'admin');

    expect(response.status).toBe(200);
    expect(prisma.order.findMany).toHaveBeenCalledTimes(1);
  });

  it("should return a user's orders including user name if requested by themselves", async () => {
    const mockOrders = [
      {
        id: 1,
        totalAmount: 100,
        status: 'completed',
        createdAt: new Date(),
        user: { name: 'Jane Doe' },
      },
    ];
    (prisma.order.findMany as jest.Mock).mockResolvedValueOnce(mockOrders);

    const response = await request(app)
      .get('/api/users/1/orders')
      .set('x-user-id', '1')
      .set('x-user-role', 'user');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(JSON.parse(JSON.stringify(mockOrders)));
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 1 },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
        select: expect.objectContaining({
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              name: true,
            },
          },
        }),
      })
    );
  });

  it('should return an empty array if the user has no orders', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/users/1/orders')
      .set('x-user-id', '1')
      .set('x-user-role', 'user');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.count).toBe(0);
  });

  it('should handle pagination correctly and cap limit at 100', async () => {
    (prisma.order.findMany as jest.Mock).mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/users/1/orders?page=2&limit=500')
      .set('x-user-id', '1')
      .set('x-user-role', 'user');

    expect(response.status).toBe(200);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100, // Capped at 100 to stay responsive
        skip: 100, // (page 2 - 1) * 100
      })
    );
  });

  it('should return 400 for invalid user id format', async () => {
    const response = await request(app)
      .get('/api/users/abc/orders')
      .set('x-user-id', '99')
      .set('x-user-role', 'admin');

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid user ID format');
  });
});
