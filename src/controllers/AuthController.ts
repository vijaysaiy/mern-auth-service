import { NextFunction, Response } from 'express';
import { validationResult } from 'express-validator';
import fs from 'fs';
import createHttpError from 'http-errors';
import { JwtPayload, sign } from 'jsonwebtoken';
import path from 'path';
import { Logger } from 'winston';
import { UserService } from '../services/UserService';
import { RegisterUserRequest } from '../types';
import { Config } from '../config';

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
                    body: { ...req.body, password: '********' },
                    errors: result.array(),
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
            let privateKey: Buffer;
            try {
                privateKey = fs.readFileSync(
                    path.join(__dirname, '../../certs/private.pem'),
                );
            } catch (error) {
                throw createHttpError(500, 'Error while reading private key');
            }

            const payload: JwtPayload = {
                sub: String(user.id),
                role: user.role,
            };
            const accessToken = sign(payload, privateKey, {
                algorithm: 'RS256',
                expiresIn: '1h',
                issuer: 'auth-service',
            });
            const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
                algorithm: 'HS256',
                expiresIn: '1y',
                issuer: 'auth-service',
            });

            res.cookie('accessToken', accessToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60, // 1h
                httpOnly: true, //very important
            });
            res.cookie('refreshToken', refreshToken, {
                domain: 'localhost',
                sameSite: 'strict',
                maxAge: 1000 * 60 * 60 * 24 * 365, // 1year
                httpOnly: true, //very important
            });
            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
