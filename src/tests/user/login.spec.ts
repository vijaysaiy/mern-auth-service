import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
describe('POST /auth/login', () => {
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

    describe('Given all field', () => {
        it('should return 200 status code', async () => {
            // Arrange
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);
            const loginData = {
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(response.statusCode).toBe(200);
        });
        it('should have json response', async () => {
            // Arrange
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);
            const loginData = {
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);
            // Assert application/json
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });
        it('should return id in the response', async () => {
            // Arrange
            //Register first since db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);
            const loginData = {
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);

            expect(response.body).toHaveProperty('id');
        });
        it('should contain refreshToken and accessToken in the cookies', async () => {
            // Arrange
            //Register first as db will be empty
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);
            const loginData = {
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            const response = await request(app)
                .post('/auth/login')
                .send(loginData);
            interface Headers {
                'set-cookie'?: string[];
            }
            //Assert
            let accessToken = null;
            let refreshToken = null;

            const cookies = (response.headers as Headers)['set-cookie'] || [];
            cookies.forEach((cookie) => {
                if (cookie.startsWith('accessToken=')) {
                    accessToken = cookie.split(';')[0].split('=')[1];
                }
                if (cookie.startsWith('refreshToken=')) {
                    refreshToken = cookie.split(';')[0].split('=')[1];
                }
            });
            expect(accessToken).not.toBeNull();
            expect(refreshToken).not.toBeNull();
        });
    });
});
