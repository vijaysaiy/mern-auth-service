import { Repository } from 'typeorm';
import { Tenant } from '../entity/Tenant';
import { TenantData } from '../types';

export class TenantService {
    constructor(private tenantRepository: Repository<Tenant>) {}

    async create(tenantData: TenantData) {
        return await this.tenantRepository.save(tenantData);
    }
}
