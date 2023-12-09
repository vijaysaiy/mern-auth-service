import request from 'supertest';
import { DataSource } from 'typeorm';
import app from '../../app';
import { AppDataSource } from '../../config/data-source';
import { Tenant } from '../../entity/Tenant';
describe('POST /tenants', () => {
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
        it('should return a 201 status code', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };
            const response = await request(app)
                .post('/tenants')
                .send(tenantData);
            expect(response.statusCode).toBe(201);
        });
        it('should create a tenant in the database', async () => {
            const tenantData = {
                name: 'Tenant name',
                address: 'Tenant address',
            };
            await request(app).post('/tenants').send(tenantData);
            const tenantRepository = connection.getRepository(Tenant);
            const tenants = await tenantRepository.find();

            expect(tenants).toHaveLength(1);
            expect(tenants[0].name).toBe(tenantData.name);
            expect(tenants[0].address).toBe(tenantData.address);
        });
    });
});
