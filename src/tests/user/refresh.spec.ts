import { sign } from 'jsonwebtoken';
import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { Config } from '../../config';
import { AppDataSource } from '../../config/data-source';
import { Roles } from '../../constants';
import { RefreshToken } from '../../entity/RefreshToken';
import { User } from '../../entity/User';
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
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const userRepository = connection.getRepository(User);

            const user = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365;
            const refreshTokenRepo = connection.getRepository(RefreshToken);
            const persistedRefreshToken = await refreshTokenRepo.save({
                user,
                expiresAt: new Date(Date.now() + MS_IN_YEAR),
            });
            const payload = {
                sub: String(user.id),
                role: Roles.CUSTOMER,
                id: persistedRefreshToken.id,
            };
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
                jwtid: String(user.id),
            });
            const response = await request(app)
                .post('/auth/refresh')
                .set('Cookie', [`refreshToken=${refreshToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });
    });
});
