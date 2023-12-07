import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
describe('POST /auth/refresh', () => {
    let connection: DataSource;
    beforeAll(async () => {
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // database truncate
        await connection.dropDatabase();
        await connection.synchronize();
    });

    afterAll(async () => {
        await connection.destroy();
    });
    describe('Given all fields', () => {
        it('should return 200 status code', async () => {
            const response = await request(app).post('/auth/refresh').send();
            expect(response.statusCode).toBe(200);
        });
    });
});
