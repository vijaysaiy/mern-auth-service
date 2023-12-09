import { NextFunction, Response } from 'express';
import { Logger } from 'winston';
import { TenantService } from '../services/TenantService';
import { CreateTenantRequest } from '../types';

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}
    async create(req: CreateTenantRequest, res: Response, next: NextFunction) {
        try {
            const { name, address } = req.body;
            this.logger.debug('New request to register a tenant', req.body);
            const tenant = await this.tenantService.create({ name, address });
            this.logger.info(
                `A new tenant has been register with id ${tenant.id}`,
            );

            res.status(201).json({ id: tenant.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
