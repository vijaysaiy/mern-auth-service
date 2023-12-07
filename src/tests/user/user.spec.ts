import createJWKSMock from 'mock-jwks';
import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
import { Roles } from '../../constants';
import { User } from '../../entity/User';
describe('GET /auth/self', () => {
    let connection: DataSource;
    let jwks: ReturnType<typeof createJWKSMock>;
    beforeAll(async () => {
        jwks = createJWKSMock('http://localhost:5501');
        connection = await AppDataSource.initialize();
    });

    beforeEach(async () => {
        // database truncate
        await connection.dropDatabase();
        await connection.synchronize();

        jwks.start();
    });

    afterEach(() => {
        jwks.stop();
    });

    afterAll(async () => {
        await connection.destroy();
    });

    describe('Given all field', () => {
        it('should return the 200 status code', async () => {
            const accessToken = jwks.token({
                sub: '1',
                role: Roles.CUSTOMER,
            });
            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();
            expect(response.statusCode).toBe(200);
        });

        it('should return the user data', async () => {
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            // Add token

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();

            // Assert
            // Check if user id matches with registered user
            console.log(response.body);
            expect((response.body as Record<string, string>).id).toBe(data.id);
        });
        it('should not have the password in user data', async () => {
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const userRepository = connection.getRepository(User);
            const data = await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });
            // Generate token
            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            });
            // Add token

            const response = await request(app)
                .get('/auth/self')
                .set('Cookie', [`accessToken=${accessToken}`])
                .send();

            // Assert
            // Check if user id matches with registered user
            expect(response.body).not.toHaveProperty('password');
        });
        it('should return 401 status code if token doesn"t exist', async () => {
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const userRepository = connection.getRepository(User);
            await userRepository.save({
                ...userData,
                role: Roles.CUSTOMER,
            });

            const response = await request(app).get('/auth/self').send();

            // Assert
            expect(response.statusCode).toBe(401);
        });
    });
});
