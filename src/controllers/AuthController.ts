import { NextFunction, Response } from 'express';
import { validationResult } from 'express-validator';
import createHttpError from 'http-errors';
import { JwtPayload } from 'jsonwebtoken';
import { Logger } from 'winston';
import { User } from '../entity/User';
import { CredentialService } from '../services/CredentialService';
import { TokenService } from '../services/TokenService';
import { UserService } from '../services/UserService';
import {
    LoginUserRequest,
    RegisterUserRequest,
    SelfAuthRequest,
} from '../types';

export class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
        private tokenService: TokenService,
        private credentialService: CredentialService,
    ) {}

    private async generateAndSetCookies(
        res: Response,
        user: User,
        deleteId: number | undefined,
    ) {
        const payload: JwtPayload = {
            sub: String(user.id),
            role: user.role,
        };

        const accessToken = this.tokenService.generateAccessToken(payload);

        // persist the refresh token
        const persistedRefreshToken =
            await this.tokenService.persistRefreshToken(user);

        // delete old token if deleteId is passed
        if (deleteId !== undefined) {
            await this.tokenService.deleteRefreshToken(deleteId);
        }

        const refreshToken = this.tokenService.getRefreshToken({
            ...payload,
            id: String(persistedRefreshToken.id),
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
    }

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

            await this.generateAndSetCookies(res, user, undefined);

            res.status(201).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        try {
            // validation
            const result = validationResult(req);

            if (!result.isEmpty()) {
                this.logger.error('Invalid field passed during login', {
                    body: { ...req.body, password: '********' },
                    errors: result.array(),
                });
                return res.status(400).json({ errors: result.array() });
            }

            const { email, password } = req.body;

            this.logger.debug('New request to login a user', {
                email,
                password: '******',
            });

            // Check if username (email) exists in database
            const user = await this.userService.findByEmail(email);
            if (!user) {
                throw createHttpError(400, 'Email or password does not match.');
            }
            // Compare password
            const hashedPassword = user.password;
            const isPasswordMatch =
                await this.credentialService.comparePassword(
                    password,
                    hashedPassword,
                );
            if (!isPasswordMatch) {
                throw createHttpError(400, 'Email or password does not match');
            }
            await this.generateAndSetCookies(res, user, undefined);
            // Return the response (id)
            this.logger.info('User has been logged in', { id: user.id });
            res.status(200).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }

    async self(req: SelfAuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.findById(Number(req.auth.sub));
            res.json({ ...user, password: undefined });
        } catch (error) {
            next(error);
            return;
        }
    }

    async refresh(req: SelfAuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.findById(Number(req.auth.sub));

            if (!user) {
                throw createHttpError(
                    400,
                    'User with the token could not be found',
                );
            }
            await this.generateAndSetCookies(res, user, Number(req.auth.id));

            this.logger.info('Token has been refreshed ', { id: user.id });
            res.status(200).json({ id: user.id });
        } catch (error) {
            next(error);
            return;
        }
    }
}
