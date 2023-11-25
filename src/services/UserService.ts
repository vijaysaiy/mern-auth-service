import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import { Repository } from 'typeorm';
import { Roles } from '../constants';
import { User } from '../entity/User';
import { UserData } from '../types';

export class UserService {
    constructor(private userRepository: Repository<User>) {}

    async create({ firstName, lastName, email, password }: UserData) {
        const user = await this.userRepository.findOne({
            where: { email: email },
        });

        if (user) {
            throw createHttpError(400, 'User with email already exist');
        }
        // Hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: Roles.CUSTOMER,
            });
        } catch (error) {
            throw createHttpError(500, 'Failed to register the user');
        }
    }
}
