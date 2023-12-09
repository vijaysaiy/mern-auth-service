import { Request } from 'express';

export interface UserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface RegisterUserRequest extends Request {
    body: UserData;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface LoginUserRequest extends Request {
    body: LoginData;
}

export interface AuthRequest extends Request {
    auth: {
        sub: string;
        role: string;
        id?: string;
    };
}

export interface AuthCookie {
    accessToken: string;
    refreshToken: string;
}

export interface IRefreshTokenPayload {
    id: string;
}

export interface TenantData {
    name: string;
    address: string;
}

export interface CreateTenantRequest extends Request {
    body: TenantData;
}
