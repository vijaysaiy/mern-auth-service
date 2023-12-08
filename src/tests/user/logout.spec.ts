import createJWKSMock from 'mock-jwks';
import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
import { Roles } from '../../constants';

describe.skip('POST /auth/logout', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;

    beforeAll(async () => {
        connection = await AppDataSource.initialize();
        jwks = createJWKSMock('http://localhost:5501');
    });

    beforeEach(async () => {
        // database truncate
        await connection.dropDatabase();
        await connection.synchronize();
        jwks.start();
    });

    afterEach(async () => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });
    describe('Given all field', () => {
        it('should return 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });
            const response = await request(app)
                .post('/auth/logout')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });
    });
});
