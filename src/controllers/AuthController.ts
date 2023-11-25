import { NextFunction, Response } from 'express';
import { validationResult } from 'express-validator';
import { Logger } from 'winston';
import { UserService } from '../services/UserService';
import { RegisterUserRequest } from '../types';

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        try {
            // Validation
            const result = validationResult(req);
            if (!result.isEmpty()) {
                this.logger.error('Invalid field passed during registration', {
                    body: req.body,
                });
                return res.status(400).json({ errors: result.array() });
            }

            const { firstName, lastName, email, password } = req.body;

            this.logger.debug('New request to register a user', {
                firstName,
                lastName,
                email,
                password: '******',
            });
            const user = await this.userService.create({
                firstName,
                lastName,
                email,
                password,
            });
            this.logger.info(
                `User has been registered with user id ${user.id}`,
            );
            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
