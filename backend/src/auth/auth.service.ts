import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    /**
     * Inscription d'un nouvel utilisateur
     */
    public async SignUp(sender: string, password: string, email: string): Promise<User> {
        if (!sender) {
            throw new BadRequestException('Sender is required');
        }
        if (!email) {
            throw new BadRequestException('Email is required');
        }
        if (!this.isValidEmail(email)) {
            throw new BadRequestException('Invalid email format');
        }
        if (!password) {
            throw new BadRequestException('Password is required');
        }

        const existingUser = await this.usersService.findOneByEmail(email);
        if (existingUser) {
            throw new UnauthorizedException('Email already exists');
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = new User();
            user.sender = sender;
            user.hashed_password = hashedPassword;
            user.email = email;

            return await this.usersService.save(user);
        } catch (error) {
            console.error('Error during signup:', error);
            throw new BadRequestException('An error occurred during signup');
        }
    }

    /**
     * Connexion d'un utilisateur et retour du token JWT
     */
    public async login(email: string, password: string): Promise<{ access_token: string }> {
        if (!email) {
            throw new BadRequestException('Email is required');
        }
        if (!this.isValidEmail(email)) {
            throw new BadRequestException('Invalid email format');
        }
        if (!password) {
            throw new BadRequestException('Password is required');
        }

        const existingUser = await this.usersService.findOneByEmail(email);
        if (!existingUser) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const passwordMatches = await bcrypt.compare(password, existingUser.hashed_password);
        if (!passwordMatches) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { id: existingUser.id };
        return { access_token: this.jwtService.sign(payload) };
    }

    /**
     * Vérifie si un email a un format valide
     */
    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
