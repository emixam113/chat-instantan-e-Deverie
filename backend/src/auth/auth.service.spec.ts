import { AuthService } from '../auth/auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { CreateUserDTO } from '../users/DTO/create-user.dto';
import { User } from '../users/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(() => {
    usersService = {
      findOneByEmail: jest.fn(),
      save: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    authService = new AuthService(jwtService, usersService);

    // Mock console.error pour éviter les logs inutiles dans les tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  // 🟢 Test de SignUp
  describe('SignUp', () => {
    it('should successfully sign up a user', async () => {
      const userDto: CreateUserDTO = { sender: 'testuser', email: 'test@example.com', hashed_password: 'password' };
      const createdUser: User = { id: 1, ...userDto, hashed_password: 'hashedpassword' } as User;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.save as jest.Mock).mockResolvedValue(createdUser);

      const result = await authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email);

      expect(result).toEqual(createdUser);
      expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({
        sender: userDto.sender,
        email: userDto.email,
        hashed_password: 'hashedpassword',
      }));
    });

    it('should throw UnauthorizedException if the email already exists', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await expect(authService.SignUp('testuser', 'password', 'test@example.com'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if sender is empty', async () => {
      await expect(authService.SignUp('', 'password', 'test@example.com'))
        .rejects.toThrow(new BadRequestException('Sender is required'));
    });

    it('should throw BadRequestException if email is empty', async () => {
      await expect(authService.SignUp('testuser', 'password', ''))
        .rejects.toThrow(new BadRequestException('Email is required'));
    });

    it('should throw BadRequestException if email format is invalid', async () => {
      await expect(authService.SignUp('testuser', 'password', 'invalid-email'))
        .rejects.toThrow(new BadRequestException('Invalid email format'));
    });

    it('should throw BadRequestException if password is empty', async () => {
      await expect(authService.SignUp('testuser', '', 'test@example.com'))
        .rejects.toThrow(new BadRequestException('Password is required'));
    });

    it('should handle database errors during signup', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.save as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.SignUp('testuser', 'password', 'test@example.com'))
        .rejects.toThrow('An error occurred during signup');
    });
  });

  // 🔑 Test de Login
  describe('Login', () => {
    it('should successfully log in a user and return a token', async () => {
      const user: User = { id: 1, email: 'test@example.com', hashed_password: 'hashedpassword' } as User;
      const token = 'jwt.token';

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (jwtService.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.login(user.email, 'password');

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith({ id: user.id });
    });

    it('should throw UnauthorizedException if the password is incorrect', async () => {
      const user: User = { id: 1, email: 'test@example.com', hashed_password: 'hashedpassword' } as User;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(user.email, 'incorrectpassword'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if the user does not exist', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException if email format is invalid', async () => {
      await expect(authService.login('invalid-email', 'password'))
        .rejects.toThrow(new BadRequestException('Invalid email format'));
    });

    it('should handle database errors during login', async () => {
      (usersService.findOneByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(authService.login('test@example.com', 'password'))
        .rejects.toThrow('Database error');
    });
  });
});
