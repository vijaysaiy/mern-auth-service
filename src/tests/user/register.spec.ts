import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
import { Roles } from '../../constants';
import { RefreshToken } from '../../entity/RefreshToken';
import { User } from '../../entity/User';
import { isJwt } from '../utils';

describe('POST /auth/register', () => {
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
        it('should return the 201 status code', async () => {
            // AAA

            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
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
                password: 'secret@123',
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
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users).toHaveLength(1);
            expect(users[0].firstName).toBe(userData.firstName);
            expect(users[0].lastName).toBe(userData.lastName);
            expect(users[0].email).toBe(userData.email);
        });
        it('should return an id of the created user', async () => {
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // assert whether response body contains id
            expect(response.body).toHaveProperty('id');
            // assert whether id is as same as it was saved in db
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect((response.body as Record<string, string>).id).toBe(
                users[0].id,
            );
        });
        it('should assign a customer role', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);

            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(users[0]).toHaveProperty('role');
            expect(users[0].role).toBe(Roles.CUSTOMER);
        });
        it('should store the hashed password in the database', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            await request(app).post('/auth/register').send(userData);

            //Asssert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            const savedPassword = users[0].password;
            expect(savedPassword).not.toBe(userData.password);

            // also check whether it is hash or not
            // bcrypt hash is 60char long
            // "$2b$10$hU30Pj7DSxYOrz1yzBqhIelA6gilEVnA/lIB6kitNgnSoVq40Mn0q"
            // $2b$ tells that this algo is bcrypt
            // $10$ tell about no of salt rounds
            // next 22 chars are salt
            // remaining 31 chars are hash value
            expect(savedPassword).toHaveLength(60);
            expect(savedPassword).toMatch(/^\$2b\$\d+\$/);
        });
        it('should return 400 status code if email already exist', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };
            const userRepository = connection.getRepository(User);
            await userRepository.save({ ...userData, role: Roles.CUSTOMER });
            const users = await userRepository.find();
            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            //Assert
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(1);
        });
        it('should return the access token and refresh token inside a cookie', async () => {
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
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
            expect(isJwt(accessToken)).toBeTruthy();
            expect(isJwt(refreshToken)).toBeTruthy();
        });
        it('should store the refresh token in the database', async () => {
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);

            const refreshTokenRepo = connection.getRepository(RefreshToken);

            const tokens = await refreshTokenRepo
                .createQueryBuilder('refreshToken')
                .where('refreshToken.userId = :userId', {
                    userId: (response.body as Record<string, string>).id,
                })
                .getMany();
            expect(tokens).toHaveLength(1);
        });
    });

    describe('Fields missing', () => {
        it('should return 400 status code if email field is missing', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: '',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
        it('should return 400 if firstName is missing', async () => {
            // Arange
            const userData = {
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
        it('should return 400 if lastName is missing', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                email: 'vijaysai@email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
        it('should return 400 if password is missing', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai@email.com',
                password: '',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
    });
    describe('Field are not in proper format', () => {
        it('should trim the email field', async () => {
            // Arrange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: ' vijaysai@email.com ',
                password: 'secret@123',
            };

            //Act
            await request(app).post('/auth/register').send(userData);

            // Assert

            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            const user = users[0];
            expect(user.email).toBe('vijaysai@email.com');
        });
        it('shoud return 400 if email is not a valid email', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: 'vijaysai.email.com',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
        it('should return 400 status code if password length is not sufficient', async () => {
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
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();
            expect(response.statusCode).toBe(400);
            expect(users).toHaveLength(0);
        });
        it('should return an array of error messages if email is missing', async () => {
            // Arange
            const userData = {
                firstName: 'Vijaysai',
                lastName: 'Y',
                email: '',
                password: 'secret@123',
            };

            // Act
            const response = await request(app)
                .post('/auth/register')
                .send(userData);
            // Assert
            const userRepository = connection.getRepository(User);
            const users = await userRepository.find();

            expect(response.statusCode).toBe(400);
            expect(response.body).toHaveProperty('errors');
            expect(
                Array.isArray((response.body as Record<string, string>).errors),
            ).toBe(true);
            expect(users).toHaveLength(0);
        });
    });
});
