import brcypt from 'bcrypt';
export class CredentialService {
    async comparePassword(userPassword: string, hashedPassword: string) {
        return await brcypt.compare(userPassword, hashedPassword);
    }
}
