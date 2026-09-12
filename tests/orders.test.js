const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/db/pool');

// Mock the DB query
jest.mock('../src/db/pool', () => ({
    query: jest.fn()
}));

describe('GET /api/users/:id/orders', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if missing x-user-id header', async () => {
        const response = await request(app).get('/api/users/1/orders');
        expect(response.status).toBe(401);
    });

    it('should return 403 if a user tries to view another user\'s orders', async () => {
        const response = await request(app)
            .get('/api/users/2/orders')
            .set('x-user-id', '1')
            .set('x-user-role', 'user');
        
        expect(response.status).toBe(403);
    });

    it('should allow an admin to view any user\'s orders', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
            .get('/api/users/2/orders')
            .set('x-user-id', '99')
            .set('x-user-role', 'admin');
        
        expect(response.status).toBe(200);
        expect(pool.query).toHaveBeenCalledTimes(1);
    });

    it('should return a user\'s orders if requested by themselves', async () => {
        const mockOrders = [
            { id: 1, total_amount: 100, status: 'completed' }
        ];
        pool.query.mockResolvedValueOnce({ rows: mockOrders });

        const response = await request(app)
            .get('/api/users/1/orders')
            .set('x-user-id', '1')
            .set('x-user-role', 'user');
        
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual(mockOrders);
    });

    it('should return an empty array if the user has no orders', async () => {
        pool.query.mockResolvedValueOnce({ rows: [] });

        const response = await request(app)
            .get('/api/users/1/orders')
            .set('x-user-id', '1')
            .set('x-user-role', 'user');
        
        expect(response.status).toBe(200);
        expect(response.body.data).toEqual([]);
    });
});
