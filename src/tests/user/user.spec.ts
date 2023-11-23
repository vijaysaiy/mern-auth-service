import request from 'supertest';
import app from '../../app';
describe('POST /auth/register', () => {
    describe('Given all fields', () => {
        it('should return the 201 status code', async () => {
            // AAA

            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Assert
            expect(response.statusCode).toBe(201);
        });

        it('should return valid json respone', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Assert application/json
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });
        it('should persist the user in the database', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            // Assert application/json
            expect(
                (response.headers as Record<string, string>)['content-type'],
            ).toEqual(expect.stringContaining('json'));
        });
    });

    describe('Fields missing', () => {});
});
