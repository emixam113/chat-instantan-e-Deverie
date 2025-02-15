import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDTO } from '../users/DTO/create-user.dto'; // Importez le DTO

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    public async SignUp(sender: string, password: string, email: string): Promise<User> {
        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new CreateUserDTO();
            user.sender = sender;
            user.hashed_password = hashedPassword;
            user.email = email;

            return this.usersService.save(user); // Utilisez le DTO
        } catch (error) {
            console.error(error); // Affiche l'erreur complète
            throw error; // Relancez l'erreur originale
        }
    }

    async login(email: string, password: string): Promise<any> {
        const existingUser = await this.usersService.findOneByEmail(email);

        if (!existingUser) {
            throw new UnauthorizedException('Invalid credentials'); // Exception plus précise
        }

        if (await bcrypt.compare(password, existingUser.hashed_password)) {
            const payload = { id: existingUser.id };
            return {
                access_token: this.jwtService.sign(payload),
            };
        }

        throw new UnauthorizedException('Invalid credentials'); // Exception plus précise
    }
}